
import React from 'react';
import { Appointment } from '../../types';

interface StatsOverviewProps {
    appointments: Appointment[];
    monthlyGoal: { target_amount: number; month: string } | null;
    setMonthlyGoal: (goal: any) => void;
    setShowGoalModal: (show: boolean) => void;
    setNewGoalValue: (value: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
    appointments,
    monthlyGoal,
    setShowGoalModal,
    setNewGoalValue
}) => {
    const getLocalTodayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const getLocalMonthStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const calculateDailyRevenue = () => {
        const today = getLocalTodayStr();
        return appointments
            .filter(app => app.date === today && (app.status === 'completed' || app.payment_status === 'paid'))
            .reduce((sum, app) => sum + Number(app.price), 0);
    };

    const calculateMonthlyRevenue = () => {
        const monthStr = getLocalMonthStr();
        return appointments
            .filter(app => app.date.startsWith(monthStr) && (app.status === 'completed' || app.payment_status === 'paid'))
            .reduce((sum, app) => sum + Number(app.price), 0);
    };

    const monthlyRevenue = calculateMonthlyRevenue();
    const dailyRevenue = calculateDailyRevenue();
    const todayApps = appointments.filter(a => a.date === getLocalTodayStr() && a.status !== 'cancelled').length;

    const stats = [
        {
            label: 'Agendamentos',
            value: todayApps,
            icon: 'event',
            trend: 'Hoje',
            color: 'bg-primary'
        },
        {
            label: 'Faturamento Diário',
            value: `R$ ${dailyRevenue.toFixed(2)}`,
            icon: 'payments',
            trend: 'Hoje',
            color: 'bg-accent-green'
        },
        {
            label: 'Faturamento Mensal',
            value: `R$ ${monthlyRevenue.toFixed(2)}`,
            icon: 'trending_up',
            trend: !monthlyGoal || monthlyGoal.target_amount === 0
                ? 'Sem Meta'
                : monthlyRevenue >= monthlyGoal.target_amount
                    ? '✓ Meta Batida'
                    : `${((monthlyRevenue / monthlyGoal.target_amount) * 100).toFixed(0)}% da Meta`,
            color: 'bg-blue-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {stats.map((stat, i) => (
                <div key={i} className="group bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 min-w-0 overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 ${stat.color} text-white rounded-xl shadow-lg ring-4 ring-offset-2 ring-transparent group-hover:ring-primary/10 transition-all`}>
                            <span className="material-icons">{stat.icon}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-stone-100 dark:bg-white/5 px-2 py-1 rounded text-stone-500 uppercase tracking-tighter group-hover:text-primary transition-colors">{stat.trend}</span>
                    </div>
                    <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">{stat.label}</p>
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 dark:text-white mt-1 group-hover:scale-105 origin-left transition-transform truncate">{stat.value}</h3>
                        {stat.label === 'Faturamento Mensal' && (
                            <button
                                onClick={() => {
                                    setNewGoalValue(monthlyGoal?.target_amount.toString() || '0');
                                    setShowGoalModal(true);
                                }}
                                className="p-2 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors text-stone-400"
                                title="Editar Meta"
                            >
                                <span className="material-icons text-sm">edit</span>
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
