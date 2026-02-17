
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AnalyticsMetrics {
    totalRevenue: number;
    totalAppointments: number;
    avgTicket: number;
    occupancyRate: number;
    newCustomers: number;
}

interface RevenueData {
    date: string;
    revenue: number;
}

interface ServiceData {
    name: string;
    value: number;
    color: string;
}

const AnalyticsOverview: React.FC = () => {
    const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [servicesData, setServicesData] = useState<ServiceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    const COLORS = ['#8B4513', '#D2691E', '#CD853F', '#DEB887', '#F4A460'];

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Métricas mensais — fallback direto se RPC falhar
            let metricsResult: AnalyticsMetrics = {
                totalRevenue: 0,
                totalAppointments: 0,
                avgTicket: 0,
                occupancyRate: 0,
                newCustomers: 0,
            };

            const { data: monthlyData, error: monthlyError } = await supabase
                .rpc('get_monthly_metrics');

            if (!monthlyError && monthlyData && monthlyData.length > 0) {
                metricsResult = {
                    totalRevenue: monthlyData[0].total_revenue || 0,
                    totalAppointments: monthlyData[0].total_appointments || 0,
                    avgTicket: monthlyData[0].avg_ticket || 0,
                    occupancyRate: monthlyData[0].occupancy_rate || 0,
                    newCustomers: monthlyData[0].new_customers || 0,
                };
            } else if (monthlyError) {
                // Fallback: calcular diretamente
                console.warn('RPC get_monthly_metrics falhou, usando fallback:', monthlyError);
                const now = new Date();
                const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

                const { data: appts } = await supabase
                    .from('appointments')
                    .select('price, status, payment_status')
                    .gte('date', monthStart)
                    .or('status.eq.completed,payment_status.eq.paid');

                if (appts && appts.length > 0) {
                    const totalRev = appts.reduce((s, a) => s + Number(a.price), 0);
                    metricsResult.totalRevenue = totalRev;
                    metricsResult.totalAppointments = appts.length;
                    metricsResult.avgTicket = totalRev / appts.length;
                }

                const { count } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', monthStart);

                metricsResult.newCustomers = count || 0;
            }

            setMetrics(metricsResult);

            // 2. Receita por período — fallback
            const endDate = new Date();
            const startDate = new Date();
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
            startDate.setDate(startDate.getDate() - days);

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const { data: revenueRawData, error: revenueError } = await supabase
                .rpc('get_revenue_by_period', {
                    start_date: startStr,
                    end_date: endStr,
                });

            if (!revenueError && revenueRawData) {
                setRevenueData(
                    revenueRawData.map((item: any) => ({
                        date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        revenue: parseFloat(item.revenue) || 0,
                    }))
                );
            } else if (revenueError) {
                console.warn('RPC get_revenue_by_period falhou, usando fallback:', revenueError);
                const { data: appts } = await supabase
                    .from('appointments')
                    .select('date, price, status, payment_status')
                    .gte('date', startStr)
                    .lte('date', endStr)
                    .or('status.eq.completed,payment_status.eq.paid');

                if (appts) {
                    const grouped: Record<string, number> = {};
                    appts.forEach(a => {
                        grouped[a.date] = (grouped[a.date] || 0) + Number(a.price);
                    });
                    setRevenueData(
                        Object.entries(grouped).sort().map(([d, r]) => ({
                            date: new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                            revenue: r,
                        }))
                    );
                }
            }

            // 3. Top serviços — fallback
            const { data: topServicesData, error: servicesError } = await supabase
                .rpc('get_top_services', { limit_count: 5 });

            if (!servicesError && topServicesData) {
                setServicesData(
                    topServicesData.map((item: any, index: number) => ({
                        name: item.service_name,
                        value: parseInt(item.total_bookings) || 0,
                        color: COLORS[index % COLORS.length],
                    }))
                );
            } else if (servicesError) {
                console.warn('RPC get_top_services falhou, usando fallback:', servicesError);
                const { data: appts } = await supabase
                    .from('appointments')
                    .select('service_name')
                    .neq('status', 'cancelled');

                if (appts) {
                    const counts: Record<string, number> = {};
                    appts.forEach(a => {
                        counts[a.service_name] = (counts[a.service_name] || 0) + 1;
                    });
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                    setServicesData(
                        sorted.map(([name, value], i) => ({
                            name,
                            value,
                            color: COLORS[i % COLORS.length],
                        }))
                    );
                }
            }
        } catch (error) {
            console.error('Erro ao buscar analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Calculate max bar width for simple chart
    const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
    const maxService = Math.max(...servicesData.map(d => d.value), 1);

    return (
        <div className="space-y-6">
            {/* Filtro de Período */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold">Analytics & Insights</h2>
                <div className="flex gap-2">
                    {(['7d', '30d', '90d'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                                ? 'bg-primary text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                                }`}
                        >
                            {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="material-icons text-3xl opacity-80">payments</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Receita</span>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">
                        R$ {metrics?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs opacity-80">Este mês</p>
                </div>

                <div className="bg-gradient-to-br from-accent-green to-accent-green/80 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="material-icons text-3xl opacity-80">event</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Agendamentos</span>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">{metrics?.totalAppointments}</p>
                    <p className="text-xs opacity-80">Este mês</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="material-icons text-3xl opacity-80">receipt_long</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Ticket Médio</span>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">
                        R$ {metrics?.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs opacity-80">Por cliente</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="material-icons text-3xl opacity-80">trending_up</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Ocupação</span>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">{metrics?.occupancyRate.toFixed(1)}%</p>
                    <p className="text-xs opacity-80">Taxa mensal</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between mb-2">
                        <span className="material-icons text-3xl opacity-80">person_add</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Novos</span>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">{metrics?.newCustomers}</p>
                    <p className="text-xs opacity-80">Clientes novos</p>
                </div>
            </div>

            {/* Gráficos com barras simples (sem dependência de recharts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Receita ao Longo do Tempo */}
                <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons text-primary">show_chart</span>
                        Receita ao Longo do Tempo
                    </h3>
                    {revenueData.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {revenueData.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-stone-500 w-12 shrink-0">{item.date}</span>
                                    <div className="flex-1 bg-stone-100 dark:bg-stone-800 h-6 rounded-full overflow-hidden">
                                        <div
                                            className="bg-primary h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                            style={{ width: `${Math.max((item.revenue / maxRevenue) * 100, 5)}%` }}
                                        >
                                            <span className="text-[10px] text-white font-bold whitespace-nowrap">
                                                R$ {item.revenue.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-stone-400">
                            <div className="text-center">
                                <span className="material-icons text-4xl mb-2">bar_chart</span>
                                <p className="text-sm">Nenhum dado de receita neste período.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Distribuição de Serviços */}
                <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons text-primary">pie_chart</span>
                        Distribuição de Serviços
                    </h3>
                    {servicesData.length > 0 ? (
                        <div className="space-y-4">
                            {servicesData.map((item, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{item.name}</span>
                                        <span className="text-sm font-bold" style={{ color: item.color }}>
                                            {item.value} agendamento{item.value !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${(item.value / maxService) * 100}%`,
                                                backgroundColor: item.color,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-stone-400">
                            <div className="text-center">
                                <span className="material-icons text-4xl mb-2">donut_large</span>
                                <p className="text-sm">Nenhum serviço agendado ainda.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Insights Automáticos */}
            <div className="bg-gradient-to-r from-primary/10 to-accent-green/10 p-4 sm:p-6 rounded-2xl border-2 border-primary/20">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-icons text-primary">lightbulb</span>
                    Insights Automáticos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics && metrics.totalAppointments === 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                📊 Nenhum agendamento registrado ainda. Os dados serão preenchidos automaticamente conforme clientes agendam.
                            </p>
                        </div>
                    )}
                    {metrics && metrics.occupancyRate > 0 && metrics.occupancyRate < 50 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                ⚠️ Taxa de ocupação baixa ({metrics.occupancyRate.toFixed(1)}%). Considere criar promoções para horários vazios.
                            </p>
                        </div>
                    )}
                    {metrics && metrics.avgTicket > 0 && metrics.avgTicket < 40 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                💡 Ticket médio pode ser aumentado. Ofereça combos de serviços!
                            </p>
                        </div>
                    )}
                    {metrics && metrics.newCustomers > 10 && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                ✅ Excelente! {metrics.newCustomers} novos clientes este mês. Continue investindo em marketing!
                            </p>
                        </div>
                    )}
                    {metrics && metrics.totalRevenue > 5000 && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
                            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                🎉 Meta de R$ 5.000 atingida! Parabéns pelo excelente desempenho!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsOverview;
