-- ============================================
-- SISTEMA DE NOTIFICAÇÕES AUTOMÁTICAS
-- ============================================

-- 1. TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('confirmation', 'reminder', 'feedback', 'reactivation')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON notifications(appointment_id);

-- 2. TABELA DE TEMPLATES
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir templates padrão
INSERT INTO notification_templates (type, name, template, variables) VALUES
('confirmation', 'Confirmação de Agendamento', 
 '✅ *Agendamento Confirmado!*

📅 Data: {{date}}
⏰ Horário: {{time}}
✂️ Serviço: {{service}}
💰 Valor: R$ {{price}}

📍 *Barbearia ZERO 7*
R. Missão Velha - São Miguel, Crato - CE

Nos vemos em breve! 💈',
 '["date", "time", "service", "price", "customer_name"]'::jsonb),

('reminder', 'Lembrete 24h Antes',
 '⏰ *Lembrete de Agendamento*

Olá {{customer_name}}! 👋

Seu horário é *amanhã*:
📅 {{date}} às {{time}}
✂️ {{service}}

Confirme sua presença respondendo:
✅ SIM - Estarei lá!
📅 REAGENDAR - Preciso mudar

Até logo! 💈',
 '["customer_name", "date", "time", "service"]'::jsonb),

('feedback', 'Solicitação de Feedback',
 '⭐ *Como foi sua experiência?*

Olá {{customer_name}}!

Esperamos que tenha gostado do seu {{service}}! 

Sua opinião é muito importante para nós.
Avalie de 1 a 5 estrelas:

⭐ ⭐⭐ ⭐⭐⭐ ⭐⭐⭐⭐ ⭐⭐⭐⭐⭐

Deixe um comentário (opcional):
_____________________

Obrigado! 🙏',
 '["customer_name", "service"]'::jsonb),

('reactivation', 'Reativação de Cliente',
 '😊 *Sentimos sua falta!*

Olá {{customer_name}}!

Faz tempo que não nos vemos... 

🎁 *OFERTA ESPECIAL PARA VOCÊ:*
{{discount}}% de desconto no seu próximo corte!

Válido até {{expiry_date}}

Agende agora e volte a ficar no estilo! 💈

[AGENDAR AGORA]',
 '["customer_name", "discount", "expiry_date"]'::jsonb)
ON CONFLICT (type) DO NOTHING;

-- 3. FUNÇÃO: CRIAR NOTIFICAÇÕES AUTOMÁTICAS APÓS AGENDAMENTO
CREATE OR REPLACE FUNCTION create_appointment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  appointment_datetime TIMESTAMP;
  customer_record RECORD;
  service_record RECORD;
BEGIN
  -- Buscar dados do cliente e serviço
  SELECT * INTO customer_record FROM customers WHERE id = NEW.customer_id;
  SELECT * INTO service_record FROM services WHERE id = NEW.service_id;
  
  -- Combinar data e hora do agendamento
  appointment_datetime := (NEW.date || ' ' || NEW.time)::TIMESTAMP;
  
  -- 1. NOTIFICAÇÃO DE CONFIRMAÇÃO (imediata)
  INSERT INTO notifications (
    customer_id,
    appointment_id,
    type,
    status,
    scheduled_for,
    message
  ) VALUES (
    NEW.customer_id,
    NEW.id,
    'confirmation',
    'pending',
    NOW(),
    format(
      E'✅ *Agendamento Confirmado!*\n\n📅 Data: %s\n⏰ Horário: %s\n✂️ Serviço: %s\n💰 Valor: R$ %.2f\n\n📍 *Barbearia ZERO 7*\nR. Missão Velha - São Miguel, Crato - CE\n\nNos vemos em breve! 💈',
      TO_CHAR(NEW.date, 'DD/MM/YYYY'),
      NEW.time,
      service_record.name,
      service_record.price
    )
  );
  
  -- 2. NOTIFICAÇÃO DE LEMBRETE (24h antes)
  IF appointment_datetime > NOW() + INTERVAL '24 hours' THEN
    INSERT INTO notifications (
      customer_id,
      appointment_id,
      type,
      status,
      scheduled_for,
      message
    ) VALUES (
      NEW.customer_id,
      NEW.id,
      'reminder',
      'pending',
      appointment_datetime - INTERVAL '24 hours',
      format(
        E'⏰ *Lembrete de Agendamento*\n\nOlá %s! 👋\n\nSeu horário é *amanhã*:\n📅 %s às %s\n✂️ %s\n\nConfirme sua presença respondendo:\n✅ SIM - Estarei lá!\n📅 REAGENDAR - Preciso mudar\n\nAté logo! 💈',
        customer_record.name,
        TO_CHAR(NEW.date, 'DD/MM/YYYY'),
        NEW.time,
        service_record.name
      )
    );
  END IF;
  
  -- 3. NOTIFICAÇÃO DE FEEDBACK (2h após o horário)
  INSERT INTO notifications (
    customer_id,
    appointment_id,
    type,
    status,
    scheduled_for,
    message
  ) VALUES (
    NEW.customer_id,
    NEW.id,
    'feedback',
    'pending',
    appointment_datetime + INTERVAL '2 hours',
    format(
      E'⭐ *Como foi sua experiência?*\n\nOlá %s!\n\nEsperamos que tenha gostado do seu %s!\n\nSua opinião é muito importante para nós.\nAvalie de 1 a 5 estrelas:\n\n⭐ ⭐⭐ ⭐⭐⭐ ⭐⭐⭐⭐ ⭐⭐⭐⭐⭐\n\nDeixe um comentário (opcional):\n_____________________\n\nObrigado! 🙏',
      customer_record.name,
      service_record.name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER: CRIAR NOTIFICAÇÕES AO INSERIR AGENDAMENTO
DROP TRIGGER IF NOT EXISTS trigger_create_notifications ON appointments;
CREATE TRIGGER trigger_create_notifications
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notifications();

-- 5. FUNÇÃO: BUSCAR NOTIFICAÇÕES PENDENTES
CREATE OR REPLACE FUNCTION get_pending_notifications(batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  appointment_id UUID,
  type TEXT,
  message TEXT,
  scheduled_for TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    n.appointment_id,
    n.type,
    n.message,
    n.scheduled_for
  FROM notifications n
  JOIN customers c ON n.customer_id = c.id
  WHERE n.status = 'pending'
    AND n.scheduled_for <= NOW()
  ORDER BY n.scheduled_for ASC
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO: MARCAR NOTIFICAÇÃO COMO ENVIADA
CREATE OR REPLACE FUNCTION mark_notification_sent(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET 
    status = 'sent',
    sent_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO: MARCAR NOTIFICAÇÃO COMO FALHA
CREATE OR REPLACE FUNCTION mark_notification_failed(
  notification_id UUID,
  error_msg TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET 
    status = 'failed',
    error_message = error_msg,
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNÇÃO: CANCELAR NOTIFICAÇÕES DE UM AGENDAMENTO
CREATE OR REPLACE FUNCTION cancel_appointment_notifications(appointment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE appointment_id = appointment_id
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- 9. TRIGGER: CANCELAR NOTIFICAÇÕES SE AGENDAMENTO FOR CANCELADO
CREATE OR REPLACE FUNCTION handle_appointment_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    PERFORM cancel_appointment_notifications(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF NOT EXISTS trigger_cancel_notifications ON appointments;
CREATE TRIGGER trigger_cancel_notifications
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_cancellation();

-- 10. FUNÇÃO: IDENTIFICAR CLIENTES INATIVOS PARA REATIVAÇÃO
CREATE OR REPLACE FUNCTION get_inactive_customers(days_inactive INTEGER DEFAULT 30)
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  last_visit_date DATE,
  days_since_visit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH last_appointments AS (
    SELECT 
      customer_id,
      MAX(date) as last_date
    FROM appointments
    WHERE status IN ('completed', 'confirmed')
    GROUP BY customer_id
  )
  SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    la.last_date as last_visit_date,
    (CURRENT_DATE - la.last_date)::INTEGER as days_since_visit
  FROM customers c
  JOIN last_appointments la ON c.id = la.customer_id
  WHERE (CURRENT_DATE - la.last_date) >= days_inactive
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.customer_id = c.id
        AND n.type = 'reactivation'
        AND n.created_at > NOW() - INTERVAL '30 days'
    )
  ORDER BY days_since_visit DESC;
END;
$$ LANGUAGE plpgsql;
