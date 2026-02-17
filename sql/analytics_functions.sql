-- ============================================
-- FUNÇÕES SQL PARA ANALYTICS
-- ============================================

-- 1. RECEITA POR PERÍODO
CREATE OR REPLACE FUNCTION get_revenue_by_period(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  date DATE,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.date::DATE,
    COALESCE(SUM(s.price), 0) as revenue
  FROM appointments a
  JOIN services s ON a.service_id = s.id
  WHERE a.date BETWEEN start_date AND end_date
    AND a.status IN ('completed', 'confirmed')
  GROUP BY a.date::DATE
  ORDER BY a.date::DATE;
END;
$$ LANGUAGE plpgsql;

-- 2. TAXA DE OCUPAÇÃO DIÁRIA
CREATE OR REPLACE FUNCTION get_daily_occupancy(target_date DATE)
RETURNS NUMERIC AS $$
DECLARE
  total_slots INTEGER := 15; -- 08:00 às 22:00 (15 horários)
  booked_slots INTEGER;
  occupancy_rate NUMERIC;
BEGIN
  SELECT COUNT(*) INTO booked_slots
  FROM appointments
  WHERE date = target_date;
  
  occupancy_rate := (booked_slots::NUMERIC / total_slots::NUMERIC) * 100;
  RETURN ROUND(occupancy_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- 3. TOP SERVIÇOS
CREATE OR REPLACE FUNCTION get_top_services(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  service_id UUID,
  service_name TEXT,
  total_bookings BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as service_id,
    s.name as service_name,
    COUNT(a.id) as total_bookings,
    SUM(s.price) as total_revenue
  FROM services s
  LEFT JOIN appointments a ON s.id = a.service_id
  WHERE a.status IN ('completed', 'confirmed')
  GROUP BY s.id, s.name
  ORDER BY total_bookings DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 4. TICKET MÉDIO
CREATE OR REPLACE FUNCTION get_average_ticket()
RETURNS NUMERIC AS $$
DECLARE
  avg_ticket NUMERIC;
BEGIN
  SELECT AVG(s.price) INTO avg_ticket
  FROM appointments a
  JOIN services s ON a.service_id = s.id
  WHERE a.status IN ('completed', 'confirmed');
  
  RETURN COALESCE(ROUND(avg_ticket, 2), 0);
END;
$$ LANGUAGE plpgsql;

-- 5. CLIENTES NOVOS VS RECORRENTES (ÚLTIMOS 30 DIAS)
CREATE OR REPLACE FUNCTION get_customer_stats()
RETURNS TABLE (
  new_customers BIGINT,
  returning_customers BIGINT,
  total_customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH customer_visits AS (
    SELECT 
      customer_id,
      COUNT(*) as visit_count,
      MIN(created_at) as first_visit
    FROM appointments
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY customer_id
  )
  SELECT 
    COUNT(*) FILTER (WHERE visit_count = 1) as new_customers,
    COUNT(*) FILTER (WHERE visit_count > 1) as returning_customers,
    COUNT(*) as total_customers
  FROM customer_visits;
END;
$$ LANGUAGE plpgsql;

-- 6. HEATMAP DE OCUPAÇÃO (DIA DA SEMANA X HORÁRIO)
CREATE OR REPLACE FUNCTION get_occupancy_heatmap()
RETURNS TABLE (
  day_of_week INTEGER,
  hour INTEGER,
  booking_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DOW FROM date::TIMESTAMP)::INTEGER as day_of_week,
    EXTRACT(HOUR FROM time::TIME)::INTEGER as hour,
    COUNT(*) as booking_count
  FROM appointments
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY day_of_week, hour
  ORDER BY day_of_week, hour;
END;
$$ LANGUAGE plpgsql;

-- 7. MÉTRICAS GERAIS DO MÊS ATUAL
CREATE OR REPLACE FUNCTION get_monthly_metrics()
RETURNS TABLE (
  total_revenue NUMERIC,
  total_appointments BIGINT,
  avg_ticket NUMERIC,
  occupancy_rate NUMERIC,
  new_customers BIGINT
) AS $$
DECLARE
  month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  month_end DATE := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
  total_slots INTEGER;
BEGIN
  -- Calcular total de slots no mês
  total_slots := (EXTRACT(DAY FROM month_end) * 15)::INTEGER;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(s.price), 0) as total_revenue,
    COUNT(a.id) as total_appointments,
    COALESCE(AVG(s.price), 0) as avg_ticket,
    ROUND((COUNT(a.id)::NUMERIC / total_slots::NUMERIC) * 100, 2) as occupancy_rate,
    COUNT(DISTINCT a.customer_id) FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM appointments a2 
        WHERE a2.customer_id = a.customer_id 
        AND a2.created_at < month_start
      )
    ) as new_customers
  FROM appointments a
  JOIN services s ON a.service_id = s.id
  WHERE a.date BETWEEN month_start AND month_end
    AND a.status IN ('completed', 'confirmed');
END;
$$ LANGUAGE plpgsql;

-- 8. COMPARAÇÃO COM MÊS ANTERIOR
CREATE OR REPLACE FUNCTION get_month_comparison()
RETURNS TABLE (
  metric TEXT,
  current_month NUMERIC,
  previous_month NUMERIC,
  change_percent NUMERIC
) AS $$
DECLARE
  current_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  current_end DATE := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
  previous_start DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  previous_end DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
BEGIN
  RETURN QUERY
  WITH current_metrics AS (
    SELECT 
      SUM(s.price) as revenue,
      COUNT(a.id) as appointments
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE a.date BETWEEN current_start AND current_end
      AND a.status IN ('completed', 'confirmed')
  ),
  previous_metrics AS (
    SELECT 
      SUM(s.price) as revenue,
      COUNT(a.id) as appointments
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE a.date BETWEEN previous_start AND previous_end
      AND a.status IN ('completed', 'confirmed')
  )
  SELECT 
    'Receita'::TEXT,
    COALESCE(c.revenue, 0),
    COALESCE(p.revenue, 0),
    CASE 
      WHEN p.revenue > 0 THEN ROUND(((c.revenue - p.revenue) / p.revenue) * 100, 2)
      ELSE 0
    END
  FROM current_metrics c, previous_metrics p
  UNION ALL
  SELECT 
    'Agendamentos'::TEXT,
    COALESCE(c.appointments, 0),
    COALESCE(p.appointments, 0),
    CASE 
      WHEN p.appointments > 0 THEN ROUND(((c.appointments - p.appointments)::NUMERIC / p.appointments::NUMERIC) * 100, 2)
      ELSE 0
    END
  FROM current_metrics c, previous_metrics p;
END;
$$ LANGUAGE plpgsql;
