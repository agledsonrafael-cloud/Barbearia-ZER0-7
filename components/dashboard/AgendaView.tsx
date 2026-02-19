import React from 'react';
import { Appointment } from '../../types';
import { IMAGES } from '../../constants';

interface AgendaViewProps {
    appointments: Appointment[];
    viewDate: Date;
    setViewDate: (date: Date) => void;
    currentMonthStr: string;
}

const AgendaView: React.FC<AgendaViewProps> = ({ appointments, viewDate, setViewDate, currentMonthStr }) => {
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfWeek = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    // Helper to check if a day has appointments
    const getDayStatus = (day: number) => {
        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayApps = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
        if (dayApps.length === 0) return 'empty';
        if (dayApps.every(a => a.status === 'completed')) return 'completed';
        return 'busy';
    };

    const selectedDayApps = (day: number) => {
        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return appointments.filter(a => a.date === dateStr);
    };

    const getMonthName = (date: Date) => {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return months[date.getMonth()];
    };

    const getLocalTodayStr = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Calendar Widget */}
            <div className="lg:col-span-12 xl:col-span-8 space-y-8">
                <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-stone-200 dark:border-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div>
                            <h3 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Agenda</h3>
                            <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">{getMonthName(viewDate)} {viewDate.getFullYear()}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                className="p-4 bg-stone-100 dark:bg-white/5 hover:bg-primary hover:text-white rounded-2xl transition-all"
                            >
                                <span className="material-icons">chevron_left</span>
                            </button>
                            <button
                                onClick={() => setViewDate(new Date())}
                                className="px-6 bg-stone-100 dark:bg-white/5 hover:bg-primary hover:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                            >
                                Hoje
                            </button>
                            <button
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                className="p-4 bg-stone-100 dark:bg-white/5 hover:bg-primary hover:text-white rounded-2xl transition-all"
                            >
                                <span className="material-icons">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4 mb-4 text-center">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                            <div key={d} className="text-stone-400 text-[10px] font-black uppercase tracking-widest">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2 sm:gap-4">
                        {[...Array(getFirstDayOfWeek(viewDate))].map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square"></div>
                        ))}
                        {[...Array(getDaysInMonth(viewDate))].map((_, i) => {
                            const day = i + 1;
                            const status = getDayStatus(day);
                            const isToday = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === getLocalTodayStr();

                            return (
                                <div key={day} className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all group cursor-default
                    ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20' :
                                        status === 'busy' ? 'bg-stone-100 dark:bg-white/10 text-stone-900 dark:text-white font-bold' :
                                            status === 'completed' ? 'bg-accent-green/10 text-accent-green' :
                                                'hover:bg-stone-50 dark:hover:bg-white/5 text-stone-400'
                                    }`}>
                                    <span className="text-lg font-bold">{day}</span>
                                    {status !== 'empty' && (
                                        <div className="flex gap-1 mt-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${status === 'busy' ? 'bg-primary' : 'bg-accent-green'}`}></span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Monthly List */}
                <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-stone-200 dark:border-white/5">
                    <h4 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight mb-6">Visão Geral do Mês</h4>
                    {appointments.filter(a => a.date.startsWith(`${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}`)).length === 0 ? (
                        <>
                            <div className="py-20 text-center bg-stone-50 dark:bg-white/5 rounded-3xl border border-dashed border-stone-200 dark:border-white/10">
                                <span className="material-icons text-stone-300 text-5xl mb-4">event_busy</span>
                                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Nenhum agendamento neste mês</p>
                            </div>
                        </>
                    ) : (
                        <div className="col-span-7 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {appointments
                                .filter(a => a.date.startsWith(`${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}`))
                                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                                .map((app) => (
                                    <div key={app.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl sm:rounded-3xl transition-all hover:bg-white dark:hover:bg-white/10 gap-3 sm:gap-0">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-center min-w-[50px]">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{app.date.split('-')[2]}</span>
                                                <span className="text-xl font-black text-stone-900 dark:text-white">{app.time}</span>
                                            </div>
                                            <div className="w-px h-10 bg-stone-200 dark:bg-white/10"></div>
                                            <div>
                                                <p className="font-black text-stone-900 dark:text-white text-base tracking-tight">{app.client_name}</p>
                                                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">{app.service_name}</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${app.status === 'completed' ? 'bg-accent-green/10 text-accent-green' :
                                            app.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                                'bg-primary/10 text-primary'
                                            }`}>
                                            {app.status === 'completed' ? 'Finalizado' : app.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Day Details Pane */}
            <div className="lg:col-span-12 xl:col-span-4 space-y-6">
                <div className="bg-stone-900 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden group border border-white/5">
                    <div className="relative z-10">
                        <h4 className="text-white text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                            <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></span>
                            Próximos Hoje
                        </h4>
                        <div className="space-y-4">
                            {appointments
                                .filter(a => a.date === getLocalTodayStr() && (a.status === 'confirmed' || a.status === 'pending' || a.status === 'in_progress'))
                                .sort((a, b) => a.time.localeCompare(b.time))
                                .slice(0, 4)
                                .map((app) => (
                                    <div key={app.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black text-xs">
                                                {app.time}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-white text-sm tracking-tight">{app.client_name}</span>
                                                <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">{app.service_name}</span>
                                            </div>
                                        </div>
                                        <button className="w-8 h-8 bg-white/5 text-stone-400 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                            <span className="material-icons text-sm">chevron_right</span>
                                        </button>
                                    </div>
                                ))}
                            {appointments.filter(a => a.date === getLocalTodayStr() && (a.status === 'confirmed' || a.status === 'pending' || a.status === 'in_progress')).length === 0 && (
                                <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Sem clientes para hoje</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <span className="material-icons absolute -right-6 -bottom-6 text-white/5 text-[140px] rotate-12 transition-transform group-hover:scale-110">access_time</span>
                </div>

                <div className="bg-gradient-to-br from-stone-800 to-stone-950 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden">
                    <h4 className="text-white text-lg font-black uppercase tracking-tighter mb-4">Lembrete do Dia</h4>
                    <p className="text-stone-400 text-sm leading-relaxed mb-6 italic">"A excelência não é um ato, mas um hábito. Cada corte é uma obra de arte."</p>
                    <div className="flex items-center gap-3">
                        <img src={IMAGES.BARBER_PROFILE} className="w-8 h-8 rounded-full border border-primary/50" alt="Avatar" />
                        <div>
                            <p className="text-white text-[10px] font-black uppercase">Rodrigo Silva</p>
                            <p className="text-primary text-[8px] font-black uppercase tracking-widest">Proprietário</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgendaView;
