import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types';

interface MyBookingsViewProps {
    onBack: () => void;
}

const MyBookingsView: React.FC<MyBookingsViewProps> = ({ onBack }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [searched, setSearched] = useState(false);

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            alert('Por favor, digite um número de telefone válido.');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('client_phone', cleanPhone)
                .in('status', ['confirmed', 'pending']) // Only show active appointments
                .gte('date', new Date().toISOString().split('T')[0]) // Only future or today's appointments
                .order('date', { ascending: true })
                .order('time', { ascending: true });

            if (error) throw error;
            setAppointments(data || []);
            setSearched(true);
        } catch (err: any) {
            alert('Erro ao buscar agendamentos: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setAppointments(prev => prev.filter(app => app.id !== id));
            alert('Agendamento cancelado com sucesso!');

            // Optional: Add notification for admin about cancellation
            await supabase.from('notifications').insert([{
                title: 'Cancelamento pelo Cliente',
                message: `Um cliente cancelou o agendamento via auto-atendimento.`,
                type: 'system',
                read: false
            }]);

        } catch (err: any) {
            alert('Erro ao cancelar: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-stone-900 text-white p-4">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 max-w-md mx-auto">
                <button onClick={onBack} className="text-stone-400 hover:text-white flex items-center gap-2">
                    <span className="material-icons">arrow_back</span> Voltar
                </button>
                <h1 className="text-xl font-black uppercase tracking-widest text-primary">Meus Agendamentos</h1>
            </header>

            <main className="max-w-md mx-auto space-y-6">
                {/* Search Form */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <p className="text-stone-400 text-sm mb-4">Digite seu número de telefone para encontrar seus horários agendados.</p>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-primary mb-1">Seu Telefone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(formatPhone(e.target.value))}
                                placeholder="(00) 00000-0000"
                                className="w-full bg-stone-800 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || phone.length < 10}
                            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="material-icons animate-spin">sync</span>
                            ) : (
                                <span className="material-icons">search</span>
                            )}
                            Buscar Agendamentos
                        </button>
                    </form>
                </div>

                {/* Results */}
                {searched && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-white/10 pb-2">
                            Seus Horários ({appointments.length})
                        </h2>

                        {appointments.length === 0 ? (
                            <div className="text-center py-8 text-stone-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                <span className="material-icons text-4xl mb-2">event_busy</span>
                                <p>Nenhum agendamento encontrado.</p>
                            </div>
                        ) : (
                            appointments.map(app => (
                                <div key={app.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-colors">
                                    <div>
                                        <p className="font-bold text-lg text-primary">{app.service_name}</p>
                                        <div className="text-stone-400 text-sm flex items-center gap-2 mt-1">
                                            <span className="material-icons text-xs">calendar_today</span>
                                            {new Date(app.date).toLocaleDateString('pt-BR')}
                                            <span className="material-icons text-xs ml-1">schedule</span>
                                            {app.time}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCancel(app.id)}
                                        className="bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                        title="Cancelar este agendamento"
                                    >
                                        <span className="material-icons">cancel</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyBookingsView;
