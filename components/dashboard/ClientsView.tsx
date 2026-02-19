
import React from 'react';
import { Appointment } from '../../types';

interface ClientsViewProps {
    customers: any[];
    appointments: Appointment[];
}

const ClientsView: React.FC<ClientsViewProps> = ({ customers, appointments }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Base de Clientes</h3>
                    <p className="text-stone-500 text-sm mt-1">{customers.length} cliente{customers.length !== 1 ? 's' : ''} cadastrado{customers.length !== 1 ? 's' : ''}.</p>
                </div>
                <div className="bg-primary/10 text-primary font-black px-6 py-3 rounded-2xl text-sm">
                    <span className="material-icons text-sm mr-1 align-middle">auto_awesome</span>
                    Cadastro Automático via Agendamento
                </div>
            </div>

            {customers.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-stone-900 rounded-[3rem] border border-dashed border-stone-200 dark:border-white/10">
                    <span className="material-icons text-stone-200 dark:text-white/10 text-6xl mb-4">groups</span>
                    <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Nenhum cliente ainda</p>
                    <p className="text-stone-400 text-xs mt-2">Assim que alguém fizer um agendamento, aparecerá aqui automaticamente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map((c: any) => {
                        const customerApps = appointments.filter(a => a.client_phone === c.phone);
                        const totalSpent = customerApps.filter(a => a.status === 'completed' || a.payment_status === 'paid').reduce((s, a) => s + Number(a.price), 0);
                        const lastApp = customerApps.length > 0 ? customerApps[0] : null;
                        return (
                            <div key={c.id} className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-stone-200 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/3 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-lg">
                                            {c.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-stone-900 dark:text-white text-base tracking-tight truncate">{c.name}</p>
                                            <p className="text-xs text-stone-400 font-medium">{c.phone}</p>
                                        </div>
                                        {c.visits_count >= 10 && (
                                            <span className="bg-yellow-400/20 text-yellow-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase">VIP</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-100 dark:border-white/5">
                                        <div className="text-center">
                                            <p className="text-lg font-black text-primary">{c.visits_count || 0}</p>
                                            <p className="text-[9px] text-stone-400 font-bold uppercase">Visitas</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black text-accent-green">R$ {totalSpent.toFixed(0)}</p>
                                            <p className="text-[9px] text-stone-400 font-bold uppercase">Total</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-stone-600 dark:text-stone-300">{lastApp ? lastApp.date.split('-').reverse().slice(0, 2).join('/') : '-'}</p>
                                            <p className="text-[9px] text-stone-400 font-bold uppercase">Última</p>
                                        </div>
                                    </div>
                                    {c.visits_count > 0 && c.visits_count % 10 === 0 && (
                                        <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-xl text-center">
                                            <p className="text-[10px] font-black text-yellow-700 dark:text-yellow-300">🎁 Próximo corte GRÁTIS!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ClientsView;
