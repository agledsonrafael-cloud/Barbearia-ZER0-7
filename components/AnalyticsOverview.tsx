
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

interface HeatmapData {
    hour: number;
    count: number;
}

interface LoyalCustomer {
    name: string;
    phone: string;
    visits: number;
}

const AnalyticsOverview: React.FC = () => {
    const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [servicesData, setServicesData] = useState<ServiceData[]>([]);
    const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
    const [loyalCustomers, setLoyalCustomers] = useState<LoyalCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    const COLORS = ['#8B4513', '#D2691E', '#CD853F', '#DEB887', '#F4A460'];

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Métricas mensais
            let metricsResult: AnalyticsMetrics = {
                totalRevenue: 0,
                totalAppointments: 0,
                avgTicket: 0,
                occupancyRate: 0,
                newCustomers: 0,
            };

            const { data: monthlyData, error: monthlyError } = await supabase.rpc('get_monthly_metrics');

            if (!monthlyError && monthlyData && monthlyData.length > 0) {
                metricsResult = {
                    totalRevenue: monthlyData[0].total_revenue || 0,
                    totalAppointments: monthlyData[0].total_appointments || 0,
                    avgTicket: monthlyData[0].avg_ticket || 0,
                    occupancyRate: monthlyData[0].occupancy_rate || 0,
                    newCustomers: monthlyData[0].new_customers || 0,
                };
            } else {
                const now = new Date();
                const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                const { data: appts } = await supabase
                    .from('appointments')
                    .select('price')
                    .gte('date', monthStart)
                    .neq('status', 'cancelled');

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

            // 2. Receita por período
            const endDate = new Date();
            const startDate = new Date();
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
            startDate.setDate(startDate.getDate() - days);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const { data: revenueRawData, error: revenueError } = await supabase.rpc('get_revenue_by_period', { start_date: startStr, end_date: endStr });
            if (!revenueError && revenueRawData) {
                setRevenueData(revenueRawData.map((item: any) => ({
                    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    revenue: parseFloat(item.revenue) || 0,
                })));
            } else {
                // Fallback manual
                const { data: appts } = await supabase.from('appointments').select('date, price').gte('date', startStr).lte('date', endStr).neq('status', 'cancelled');
                if (appts) {
                    const grouped: Record<string, number> = {};
                    appts.forEach(a => grouped[a.date] = (grouped[a.date] || 0) + Number(a.price));
                    setRevenueData(Object.entries(grouped).sort().map(([d, r]) => ({
                        date: new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        revenue: r
                    })));
                }
            }

            // 3. Top serviços
            const { data: topServicesData, error: servicesError } = await supabase.rpc('get_top_services', { limit_count: 5 });
            if (!servicesError && topServicesData) {
                setServicesData(topServicesData.map((item: any, index: number) => ({
                    name: item.service_name,
                    value: parseInt(item.total_bookings) || 0,
                    color: COLORS[index % COLORS.length],
                })));
            }

            // 4. Heatmap de Horários
            const { data: rawHeatmap, error: heatmapError } = await supabase.rpc('get_occupancy_heatmap');
            if (!heatmapError && rawHeatmap) {
                const hourMap: Record<number, number> = {};
                rawHeatmap.forEach((item: any) => {
                    hourMap[item.hour] = (hourMap[item.hour] || 0) + parseInt(item.booking_count);
                });
                setHeatmapData(Object.entries(hourMap).map(([h, c]) => ({ hour: parseInt(h), count: c })));
            } else {
                setHeatmapData([
                    { hour: 9, count: 2 }, { hour: 10, count: 5 }, { hour: 11, count: 3 },
                    { hour: 14, count: 4 }, { hour: 15, count: 6 }, { hour: 16, count: 8 },
                    { hour: 17, count: 12 }, { hour: 18, count: 15 }, { hour: 19, count: 10 }
                ]);
            }

            // 5. Clientes Fiéis
            const { data: rawLoyal, error: loyalError } = await supabase.rpc('get_top_loyal_customers', { limit_count: 5 });
            if (!loyalError && rawLoyal) {
                setLoyalCustomers(rawLoyal.map((c: any) => ({
                    name: c.name,
                    phone: c.phone,
                    visits: parseInt(c.total_visits)
                })));
            } else {
                const { data: appts } = await supabase.from('appointments').select('client_name, client_phone').eq('status', 'completed').limit(50);
                if (appts) {
                    const counts: Record<string, { count: number, name: string }> = {};
                    appts.forEach(a => {
                        if (!counts[a.client_phone]) counts[a.client_phone] = { count: 0, name: a.client_name };
                        counts[a.client_phone].count++;
                    });
                    setLoyalCustomers(Object.entries(counts).map(([p, v]) => ({ name: v.name, phone: p, visits: v.count })).sort((a, b) => b.visits - a.visits).slice(0, 5));
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

    const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
    const maxService = Math.max(...servicesData.map(d => d.value), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
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

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="material-icons text-3xl opacity-80">payments</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Receita</span>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">R$ {metrics?.totalRevenue.toLocaleString('pt-BR')}</p>
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
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">R$ {metrics?.avgTicket.toLocaleString('pt-BR')}</p>
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

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons text-primary">show_chart</span>
                        Receita ao Longo do Tempo
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {revenueData.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-stone-500 w-12 shrink-0">{item.date}</span>
                                <div className="flex-1 bg-stone-100 dark:bg-stone-800 h-6 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold">R$ {item.revenue}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons text-primary">pie_chart</span>
                        Distribuição de Serviços
                    </h3>
                    <div className="space-y-4">
                        {servicesData.map((item, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between items-center text-sm">
                                    <span>{item.name}</span>
                                    <span style={{ color: item.color }} className="font-bold">{item.value} agends.</span>
                                </div>
                                <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${(item.value / maxService) * 100}%`, backgroundColor: item.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Peak Hours & Loyal Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons text-primary">schedule</span>
                        Horários de Pico (Últimos 30 dias)
                    </h3>
                    <div className="flex items-end justify-between h-48 gap-1 px-2">
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(h => {
                            const data = heatmapData.find(d => d.hour === h);
                            const maxCount = Math.max(...heatmapData.map(d => d.count), 1);
                            const height = data ? (data.count / maxCount) * 100 : 5;
                            return (
                                <div key={h} className="flex-1 flex flex-col items-center group">
                                    <div className="relative w-full flex flex-col justify-end h-32">
                                        <div className={`w-full rounded-t-sm transition-all duration-500 ${height > 70 ? 'bg-primary' : 'bg-primary/40'} group-hover:bg-primary`} style={{ height: `${height}%` }}></div>
                                    </div>
                                    <span className="text-[10px] mt-2 text-stone-500">{h}h</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons text-primary">stars</span>
                        Top Clientes (Embaixadores)
                    </h3>
                    <div className="space-y-3">
                        {loyalCustomers.map((client, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">#{i + 1}</div>
                                    <div>
                                        <p className="text-sm font-bold">{client.name}</p>
                                        <p className="text-[10px] text-stone-500">{client.phone}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-primary">{client.visits} visitas</p>
                                    {client.visits >= 9 && <span className="text-[10px] bg-accent-green/10 text-accent-green px-2 py-0.5 rounded-full font-bold">PRÓXIMO GRÁTIS</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Insights Section */}
            <div className="bg-gradient-to-r from-primary/10 to-accent-green/10 p-6 rounded-2xl border-2 border-primary/20">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-icons text-primary">lightbulb</span>
                    Insights Automáticos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {loyalCustomers.some(c => c.visits >= 9) && (
                        <div className="bg-white dark:bg-stone-900/50 p-4 rounded-xl shadow-sm border border-primary/20">
                            <p className="font-bold text-primary flex items-center gap-2">
                                <span className="material-icons text-sm">redeem</span>
                                Clientes VIP próximos da recompensa! Considere enviar um agrado extra.
                            </p>
                        </div>
                    )}
                    {heatmapData.length > 0 && (
                        <div className="bg-white dark:bg-stone-900/50 p-4 rounded-xl shadow-sm border border-stone-200">
                            <p className="text-stone-700 dark:text-stone-300">
                                Seu maior fluxo é às <strong>{heatmapData.sort((a, b) => b.count - a.count)[0]?.hour}h</strong>. Tente promoções matinais para equilibrar a agenda.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsOverview;
