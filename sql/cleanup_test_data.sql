-- ⚠️ SCRIPT DE LIMPEZA GERAL (GO-LIVE) ⚠️
-- Use este script no SQL Editor do Supabase para preparar o sistema para uso real.

-- 1. Limpar Agendamentos e Notificações (ESSENCIAL)
-- Isso remove todos os testes de agendamento e alertas do painel.
TRUNCATE TABLE appointments, notifications RESTART IDENTITY CASCADE;

-- 2. Limpar Clientes (OPCIONAL - Descomente se quiser zerar tudo)
-- Remover os travessões (--) abaixo apenas se quiser apagar também o cadastro dos clientes.
-- TRUNCATE TABLE customers RESTART IDENTITY CASCADE;

-- 3. Limpar Bloqueios de Agenda (OPCIONAL)
-- Se você criou bloqueios de teste (feriados falsos), descomente abaixo.
-- TRUNCATE TABLE blocked_periods RESTART IDENTITY CASCADE;

-- Confirmação (apenas para log do banco)
SELECT 'Sistema limpo e pronto para produção em: ' || NOW() as status;
