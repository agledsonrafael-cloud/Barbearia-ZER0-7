
import React from 'react';
import { Appointment, DashboardSection } from '../../types';
import { StatsOverview } from './StatsOverview';

interface OverviewViewProps {
    appointments: Appointment[];
    monthlyGoal: { target_amount: number; month: string } | null;
    setMonthlyGoal: (goal: any) => void;
    setShowGoalModal: (show: boolean) => void;
    setNewGoalValue: (value: string) => void;
    walkInData: any;
    setWalkInData: (data: any) => void;
    setShowWalkInModal: (show: boolean) => void;
    setSection: (section: DashboardSection) => void;
    fetchData: () => void;
    setShowBlockModal: (show: boolean) => void;
    handleCancelAppointment: (id: string) => void;
    setShowPaymentModal: (app: Appointment) => void;
    getLocalTodayStr: () => string;
}

const OverviewView: React.FC<OverviewViewProps> = ({
    appointments,
    monthlyGoal,
    setMonthlyGoal,
    setShowGoalModal,
    setNewGoalValue,
    walkInData,
    setWalkInData,
    setShowWalkInModal,
    setSection,
    fetchData,
    setShowBlockModal,
    handleCancelAppointment,
    setShowPaymentModal,
    getLocalTodayStr
}) => {
    const getLocalMonthStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const calculateMonthlyRevenue = () => {
        const monthStr = getLocalMonthStr();
        return appointments
            .filter(app => app.date.startsWith(monthStr) && (app.status === 'completed' || app.payment_status === 'paid'))
            .reduce((sum, app) => sum + Number(app.price), 0);
    };

    return (
        <div className="space-y-8 animate-fade-in" >
            {/* Stat Cards */}
            <StatsOverview
                appointments={appointments}
                monthlyGoal={monthlyGoal}
                setMonthlyGoal={setMonthlyGoal}
                setShowGoalModal={setShowGoalModal}
                setNewGoalValue={setNewGoalValue}
            />

            {/* Quick Actions Row */}
            <div className="bg-stone-900 rounded-2xl p-3 sm:p-4 flex flex-wrap gap-3 sm:gap-4 items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                    <span className="material-icons text-accent-green">bolt</span>
                    <span className="text-white font-bold text-sm">Ações do Admin:</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setWalkInData({ ...walkInData, date: getLocalTodayStr() });
                            setShowWalkInModal(true);
                        }}
                        className="bg-accent-green hover:bg-accent-green/90 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all uppercase tracking-widest shadow-lg shadow-accent-green/20"
                    >
                        <span className="material-icons text-sm">flash_on</span> Entrada Rápida
                    </button>
                    <button
                        onClick={() => setSection(DashboardSection.AGENDA)}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
                    >
                        <span className="material-icons text-sm">add</span> Novo Agendamento
                    </button>
                    <button
                        onClick={() => fetchData()}
                        className="bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
                    >
                        <span className="material-icons text-sm">sync</span> Atualizar Dados
                    </button>
                    <button
                        onClick={() => setShowBlockModal(true)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all uppercase tracking-widest shadow-lg shadow-red-500/20"
                    >
                        <span className="material-icons text-sm">block</span> Bloqueios
                    </button>
                </div>
            </div >

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                {/* Upcoming List - Unified Queue */}
                <div className="lg:col-span-8 space-y-6">

                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Próximos Clientes</h3>
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                            {appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length} Ativos
                        </span>
                    </div>

                    <div className="space-y-4">
                        {appointments
                            .filter(a => a.status === 'confirmed' || a.status === 'pending' || a.status === 'in_progress')
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .map((app) => (
                                <div key={app.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-white/5 shadow-sm hover:translate-x-2 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center font-black text-primary text-xl shadow-inner">
                                            {app.time.split(':')[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-stone-900 dark:text-white text-lg tracking-tight">{app.client_name}</p>
                                            <div className="flex items-center gap-3 text-stone-500 text-[10px] mt-1 font-bold uppercase tracking-widest">
                                                <span className="flex items-center gap-1"><span className="material-icons text-sm">content_cut</span> {app.service_name}</span>
                                                <span className="flex items-center gap-1"><span className="material-icons text-sm">schedule</span> {app.time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase text-stone-400 font-black tracking-widest">Valor</p>
                                            <p className="font-bold text-stone-900 dark:text-white text-lg">R$ {Number(app.price).toFixed(2)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCancelAppointment(app.id)}
                                            className="px-4 py-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 active:scale-95 transition-all flex items-center gap-1 font-black text-[10px] uppercase tracking-widest"
                                            title="Cancelar"
                                        >
                                            <span className="material-icons text-sm">close</span>
                                        </button>
                                        <button
                                            onClick={() => setShowPaymentModal(app)}
                                            className="px-6 py-3 bg-accent-green text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent-green/20 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                                        >
                                            <span className="material-icons text-sm">check_circle</span>
                                            Finalizar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        {appointments.filter(a => a.status === 'confirmed' || a.status === 'pending' || a.status === 'in_progress').length === 0 && (
                            <div className="py-12 text-center bg-white dark:bg-stone-900 rounded-[3rem] border border-dashed border-stone-100 dark:border-white/5">
                                <span className="material-icons text-stone-200 dark:text-white/10 text-5xl mb-4">event_busy</span>
                                <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Nenhum atendimento na fila</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-6">
                    <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-black uppercase tracking-widest">Meta Mensal</h4>
                                <button
                                    onClick={() => {
                                        setNewGoalValue(monthlyGoal?.target_amount.toString() || '0');
                                        setShowGoalModal(true);
                                    }}
                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                >
                                    <span className="material-icons text-sm">edit</span>
                                </button>
                            </div>
                            <p className="text-3xl font-black mb-6">R$ {monthlyGoal?.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                            <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden mb-2 shadow-inner">
                                <div
                                    className="bg-accent-green h-full shadow-lg shadow-accent-green/50 transition-all duration-1000"
                                    style={{ width: `${Math.min((calculateMonthlyRevenue() / (monthlyGoal?.target_amount || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                                {((calculateMonthlyRevenue() / (monthlyGoal?.target_amount || 1)) * 100).toFixed(1)}% Alcançado
                            </p>
                        </div>
                        <span className="material-icons absolute -right-4 -bottom-4 text-white/10 text-[120px] transition-transform group-hover:scale-125 duration-500">trending_up</span>
                    </div>

                    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm">
                        <h4 className="font-black text-stone-900 dark:text-white uppercase tracking-tighter mb-4 text-sm">Status da Agenda</h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Finalizados', count: appointments.filter(a => a.status === 'completed').length, color: 'text-accent-green' },
                                { label: 'Agendados', count: appointments.filter(a => a.status === 'confirmed').length, color: 'text-blue-500' },
                                { label: 'Cancelados', count: appointments.filter(a => a.status === 'cancelled').length, color: 'text-red-500' }
                            ].map((st, i) => (
                                <div key={i} className="flex justify-between items-center bg-stone-50 dark:bg-white/5 p-3 rounded-xl border border-stone-100 dark:border-white/10">
                                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400">{st.label}</span>
                                    <span className={`text-sm font-black ${st.color}`}>{st.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewView;
