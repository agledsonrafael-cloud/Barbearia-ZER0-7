
import React from 'react';
import { Appointment } from '../../types';
import { IMAGES } from '../../constants';

interface FinancialReportsViewProps {
    appointments: Appointment[];
    currentMonthStr: string;
}

const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({ appointments, currentMonthStr }) => {
    const monthlyApps = appointments.filter(a => a.date.startsWith(currentMonthStr));
    const paidAppointments = monthlyApps.filter(a => a.status === 'completed' || a.payment_status === 'paid');
    const pixRevenue = paidAppointments.filter(a => a.payment_method === 'pix').reduce((s, a) => s + Number(a.price), 0);
    const cashRevenue = paidAppointments.filter(a => a.payment_method === 'cash').reduce((s, a) => s + Number(a.price), 0);
    const cardRevenue = paidAppointments.filter(a => a.payment_method === 'bank').reduce((s, a) => s + Number(a.price), 0);
    const totalRevenue = pixRevenue + cashRevenue + cardRevenue;

    const handleExport = () => {
        const rows = [['Cliente', 'Serviço', 'Data', 'Hora', 'Valor', 'Método', 'Status']];
        paidAppointments.forEach(a => rows.push([a.client_name, a.service_name, a.date, a.time, `R$ ${Number(a.price).toFixed(2)}`, a.payment_method || '', a.status]));
        const csv = rows.map(r => r.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `relatorio_${currentMonthStr}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 animate-fade-in shadow-inner">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Saúde Financeira</h3>
                    <p className="text-stone-500 text-sm mt-1">Análise detalhada de faturamento e performance.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="bg-primary hover:bg-primary/90 text-white font-black py-3 px-6 rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase text-xs tracking-widest"
                >
                    <span className="material-icons text-base">ios_share</span> Exportar Relatório
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Financial Breakdown */}
                <div className="lg:col-span-12 xl:col-span-8 bg-white dark:bg-stone-900 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] border border-stone-200 dark:border-white/5 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">Faturamento por Método</h4>
                        <p className="text-[10px] text-stone-400 font-bold uppercase">Este Mês</p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { label: 'PIX (Transferência Instantânea)', val: pixRevenue, color: 'bg-teal-500', icon: 'qr_code' },
                            { label: 'Espécie (Dinheiro em Caixa)', val: cashRevenue, color: 'bg-accent-green', icon: 'payments' },
                            { label: 'Cartão (Débito e Crédito)', val: cardRevenue, color: 'bg-blue-500', icon: 'credit_card' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 ${item.color} text-white rounded-lg flex items-center justify-center shadow-lg`}>
                                            <span className="material-icons text-sm">{item.icon}</span>
                                        </div>
                                        <span className="text-xs font-black text-stone-700 dark:text-stone-400 uppercase tracking-tight">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-black text-stone-900 dark:text-white italic">R$ {item.val.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-stone-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`${item.color} h-full transition-all duration-1000 shadow-sm`}
                                        style={{ width: `${totalRevenue > 0 ? (item.val / totalRevenue) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 sm:mt-12 p-4 sm:p-6 lg:p-8 bg-stone-900 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl flex flex-col md:flex-row items-center justify-between group gap-4">
                        <div className="text-center md:text-left mb-6 md:mb-0">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Lucro Total Realizado</p>
                            <h5 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-lg tracking-tighter">R$ {totalRevenue.toFixed(2)}</h5>
                        </div>
                        <div className="flex bg-white/10 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <div className="px-6 py-3 border-r border-white/10 text-center">
                                <p className="text-accent-green text-xs font-black tracking-widest uppercase">Seguro</p>
                                <p className="text-white text-[10px] font-bold">EM CAIXA</p>
                            </div>
                            <div className="px-6 py-3 text-center">
                                <p className="text-primary text-xs font-black tracking-widest uppercase">+ R$ {appointments.filter(a => a.status === 'pending').reduce((s, a) => s + Number(a.price), 0).toFixed(2)}</p>
                                <p className="text-white text-[10px] font-bold uppercase">PROJETADO</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Stats Side */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-6">
                    {(() => {
                        const completedApps = appointments.filter(a => a.status === 'completed' || a.payment_status === 'paid');
                        const uniquePhones = new Set(completedApps.map(a => a.client_phone));
                        const returningCount = [...uniquePhones].filter(phone =>
                            completedApps.filter(a => a.client_phone === phone).length > 1
                        ).length;
                        const retentionRate = uniquePhones.size > 0 ? Math.round((returningCount / uniquePhones.size) * 100) : 0;
                        return (
                            <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] border border-stone-200 dark:border-white/5 shadow-sm text-center">
                                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <span className="material-icons text-3xl">trending_up</span>
                                </div>
                                <h4 className="text-stone-900 dark:text-white font-black uppercase tracking-tight text-xl mb-2">Retenção de Clientes</h4>
                                <p className="text-stone-500 text-xs leading-relaxed font-medium">
                                    {completedApps.length === 0
                                        ? 'Sem dados para calcular ainda. Os dados aparecerão automaticamente conforme clientes frequentarem.'
                                        : <>Taxa de retenção está em <span className="text-accent-green font-black">{retentionRate}%</span> — {uniquePhones.size} cliente{uniquePhones.size !== 1 ? 's' : ''} atendido{uniquePhones.size !== 1 ? 's' : ''}.</>
                                    }
                                </p>
                            </div>
                        );
                    })()}

                    {(() => {
                        const activeApps = appointments.filter(a => a.status !== 'cancelled');
                        const serviceCount: Record<string, number> = {};
                        activeApps.forEach(a => { serviceCount[a.service_name] = (serviceCount[a.service_name] || 0) + 1; });
                        const sorted = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]);
                        const topService = sorted.length > 0 ? sorted[0][0] : 'Nenhum ainda';
                        const topCount = sorted.length > 0 ? sorted[0][1] : 0;
                        return (
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                                <span className="material-icons absolute -right-4 -bottom-4 text-white/10 text-[140px] rotate-12 transition-transform group-hover:scale-110">insights</span>
                                <div className="relative z-10">
                                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Serviço mais Procurado</p>
                                    <h5 className="text-2xl font-black uppercase tracking-tighter mb-6">{topService}</h5>
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-primary bg-white px-2 py-1 rounded-lg text-sm">stars</span>
                                        <span className="text-xs font-black uppercase tracking-tight italic">
                                            {topCount > 0 ? `${topCount} agendamento${topCount !== 1 ? 's' : ''}` : 'Aguardando dados'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default FinancialReportsView;
