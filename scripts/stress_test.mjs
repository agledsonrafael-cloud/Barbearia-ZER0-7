
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mtjcdpfyeosjrxvsjabm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10amNkcGZ5ZW9zanJ4dnNqYWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjY5MDQsImV4cCI6MjA4NjM0MjkwNH0.t-FRBz13XLYe8UhFTPqQFdF9PKDS-s4XOwspTf4RxgI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateBooking(clientName, phone, serviceId, serviceName, price, date, time) {
    console.log(`[${clientName}] Tentando agendar para ${date} às ${time}...`);
    try {
        // Simular o "Check-Before-Book" que existe no BookingView.tsx
        const { data: conflict } = await supabase
            .from('appointments')
            .select('id')
            .eq('date', date)
            .eq('time', time)
            .neq('status', 'cancelled')
            .maybeSingle();

        if (conflict) {
            console.warn(`[${clientName}] Conflito detectado para ${time}. Abortando.`);
            return { success: false, reason: 'conflict' };
        }

        const { data, error } = await supabase
            .from('appointments')
            .insert([
                {
                    client_name: clientName,
                    client_phone: phone,
                    service_id: serviceId,
                    service_name: serviceName,
                    price: price,
                    date: date,
                    time: time,
                    status: 'confirmed'
                }
            ])
            .select();

        if (error) {
            console.error(`[${clientName}] Erro ao inserir:`, error.message);
            return { success: false, error };
        }

        console.log(`[${clientName}] Agendamento realizado com sucesso! ID: ${data[0].id}`);
        return { success: true, data };
    } catch (e) {
        console.error(`[${clientName}] Erro inesperado:`, e.message);
        return { success: false, error: e };
    }
}

async function runTests() {
    const testDate = '2026-12-25'; // Data futura para teste
    const testTime = '10:00';
    const serviceId = '4fd44bd0-8884-4632-9cb7-6469a4753066'; // ID do Corte Simples encontrado no DB

    console.log('--- INICIANDO TESTE DE CONCORRÊNCIA ---');

    // Tentar agendar 3 clientes para o MESMO horário simultaneamente
    const promises = [
        simulateBooking('Cliente A', '85999990001', serviceId, 'Corte Masculino', 35, testDate, testTime),
        simulateBooking('Cliente B', '85999990002', serviceId, 'Corte Masculino', 35, testDate, testTime),
        simulateBooking('Cliente C', '85999990003', serviceId, 'Corte Masculino', 35, testDate, testTime)
    ];

    const results = await Promise.all(promises);

    const successes = results.filter(r => r.success).length;
    console.log(`\n--- RESULTADOS ---`);
    console.log(`Sucessos: ${successes}`);
    console.log(`Falhas vinculadas a conflito esperado: ${results.filter(r => r.reason === 'conflict').length}`);

    if (successes > 1) {
        console.error('❌ ERRO CRÍTICO: Mais de um agendamento foi permitido para o mesmo horário!');
    } else {
        console.log('✅ SUCESSO: O sistema de prevenção de conflitos funcionou (apenas 1 agendamento permitido).');
    }
}

runTests();
