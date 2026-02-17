-- ============================================
-- SCRIPT: VERIFICAR E LIMPAR DADOS (VERSÃO 2)
-- ============================================
-- Execute este script passo a passo
-- ============================================

-- PASSO 1: VERIFICAR O QUE EXISTE AGORA
-- ============================================
SELECT 'ANTES DA LIMPEZA' as status;

SELECT 'Appointments' as tabela, COUNT(*) as total FROM appointments;
SELECT 'Notifications' as tabela, COUNT(*) as total FROM notifications;
SELECT 'Customers' as tabela, COUNT(*) as total FROM customers;

-- Ver detalhes dos agendamentos
SELECT id, client_name, date, time, status, created_at 
FROM appointments 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- PASSO 2: DELETAR TUDO (EXECUTE APENAS DEPOIS DE VER OS DADOS ACIMA)
-- ============================================

-- Deletar notificações primeiro (por causa de foreign keys)
DELETE FROM notifications;

-- Deletar agendamentos
DELETE FROM appointments;

-- OPCIONAL: Deletar clientes também (descomente se quiser)
-- DELETE FROM customers;

-- ============================================
-- PASSO 3: VERIFICAR SE LIMPOU
-- ============================================
SELECT 'DEPOIS DA LIMPEZA' as status;

SELECT 'Appointments' as tabela, COUNT(*) as total FROM appointments;
SELECT 'Notifications' as tabela, COUNT(*) as total FROM notifications;
SELECT 'Customers' as tabela, COUNT(*) as total FROM customers;
SELECT 'Services' as tabela, COUNT(*) as total FROM services;

-- ============================================
-- RESULTADO ESPERADO:
-- Appointments: 0
-- Notifications: 0
-- Customers: X (ou 0 se deletou)
-- Services: mantidos
-- ============================================
