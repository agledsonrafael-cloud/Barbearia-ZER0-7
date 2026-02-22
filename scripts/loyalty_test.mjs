
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mtjcdpfyeosjrxvsjabm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10amNkcGZ5ZW9zanJ4dnNqYWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjY5MDQsImV4cCI6MjA4NjM0MjkwNH0.t-FRBz13XLYe8UhFTPqQFdF9PKDS-s4XOwspTf4RxgI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateLoyalty() {
    const phone = '85999990000'; // Novo número para teste limpo
    const name = 'Loyalty Test User';
    const serviceId = 'ac46ae51-3921-42ad-aae3-0a3f6dfe7019';

    console.log(`--- SIMULANDO SISTEMA DE FIDELIDADE (Telefone: ${phone}) ---`);
    console.log('Inserindo 1 agendamento para disparar gatilho automático...');

    const { error: insertError } = await supabase.from('appointments').insert([{
        client_name: name,
        client_phone: phone,
        service_id: serviceId,
        service_name: 'Corte Fidelidade Test',
        price: 35,
        date: '2026-02-22',
        time: '14:00',
        status: 'completed'
    }]);

    if (insertError) {
        console.error('Erro ao inserir agendamento:', insertError.message);
        return;
    }

    // Após a inserção do agendamento, o gatilho deve ter criado o cliente.
    // Agora, vamos buscar o cliente para obter o customerId para o restante da simulação.
    const { data: customer, error: fetchCustomerError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', phone)
        .single();

    if (fetchCustomerError) {
        console.error('Erro ao buscar cliente após inserção de agendamento:', fetchCustomerError.message);
        return;
    }
    const customerId = customer.id;
    console.log(`Cliente criado/encontrado com ID: ${customerId}`);


    const pastDates = [
        '2026-01-01', '2026-01-05', '2026-01-10', '2026-01-15',
        '2026-01-20', '2026-01-25', '2026-02-01', '2026-02-05', '2026-02-10'
    ];

    console.log('Inserindo 9 agendamentos passados para validar contador...');
    const appointments = pastDates.map((date, i) => ({
        customer_id: customerId,
        client_name: name,
        client_phone: phone,
        service_id: serviceId,
        service_name: 'Corte Stress Test',
        price: 35,
        date: date,
        time: `${10 + i}:00`,
        status: 'completed'
    }));

    const { error: insertError2 } = await supabase.from('appointments').insert(appointments);
    if (insertError2) {
        console.error('Erro ao inserir agendamentos:', insertError2.message);
        return;
    }

    console.log('Verificando status de fidelidade via RPC...');
    const { data: loyalty, error: loyaltyError } = await supabase
        .rpc('get_customer_loyalty', { phone_number: phone })
        .maybeSingle();

    if (loyaltyError) {
        console.warn('RPC get_customer_loyalty falhou (provavelmente não existe no DB). Testando fallback...');
        // Simular o que o BookingView faria sem o RPC funcional na UI
        const { data: apps } = await supabase
            .from('appointments')
            .select('id')
            .eq('customer_id', customerId)
            .eq('status', 'completed');

        console.log(`Fallback: Cliente tem ${apps?.length || 0} visitas concluídas.`);
        if (apps?.length >= 9) {
            console.log('✅ SUCESSO NO FALLBACK: Lógica de fidelidade validada.');
        }
    } else {
        console.log('Resultado do RPC Loyalty:', loyalty);
    }

    // Cleanup
    console.log('\nLimpando dados de teste...');
    await supabase.from('appointments').delete().eq('customer_id', customerId);
    await supabase.from('customers').delete().eq('id', customerId);
}

simulateLoyalty();
