
import React, { useState, useEffect } from 'react';
import { DashboardSection, Service, Appointment, AppNotification, BlockedPeriod } from '../types';
import { IMAGES, BUSINESS_CONFIG } from '../constants';
import { supabase, autoUpdateAppointments } from '../lib/supabase';
import AnalyticsOverview from './AnalyticsOverview';
import { Sidebar } from './dashboard/Sidebar';

import { ServiceManager } from './dashboard/ServiceManager';
import FinancialReportsView from './dashboard/FinancialReportsView';
import AgendaView from './dashboard/AgendaView';
import OverviewView from './dashboard/OverviewView';
import ClientsView from './dashboard/ClientsView';
import BlocksView from './dashboard/BlocksView';

interface DashboardViewProps {
  onLogout: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onLogout }) => {
  const [section, setSection] = useState<DashboardSection>(DashboardSection.OVERVIEW);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [monthlyGoal, setMonthlyGoal] = useState<{ target_amount: number; month: string } | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState<Appointment | null>(null);
  const [showServiceModal, setShowServiceModal] = useState<Service | null>(null);
  const [newServiceData, setNewServiceData] = useState<Partial<Service>>({});
  const [paymentPhase, setPaymentPhase] = useState<'selection' | 'pix' | 'cash'>('selection');
  const [receivedCash, setReceivedCash] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pixKey] = useState(BUSINESS_CONFIG.PIX_KEY);
  const [viewDate, setViewDate] = useState(new Date());

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newBlockData, setNewBlockData] = useState({ start_date: '', end_date: '', reason: '' });
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInData, setWalkInData] = useState({
    client_name: 'Cliente Avulso',
    service_id: '',
    time: '',
    date: ''
  });

  const getLocalTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getLocalMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonthStr = getLocalMonthStr();


  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.first_login) {
        setMustChangePassword(true);
      }
    };
    checkUserStatus();
    autoUpdateAppointments();
    fetchData();
    fetchGoal();

    fetchNotifications();
    fetchBlockedPeriods();

    // Real-time notifications subscription
    const channelNotifications = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        setNotifications(prev => [payload.new as AppNotification, ...prev]);
        // Simple visual/audio cue logic
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => { }); // Browser might block auto-play
        } catch (e) { }
      })
      .subscribe();

    // Real-time appointments subscription
    const channelAppointments = supabase
      .channel('public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchData(); // Refresh everything when appointments change
      })
      .subscribe();

    // Real-time goals subscription
    const channelGoals = supabase
      .channel('public:business_goals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_goals' }, () => {
        fetchGoal(); // Refresh goal progress
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelNotifications);
      supabase.removeChannel(channelAppointments);
      supabase.removeChannel(channelGoals);
    };
  }, [section]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  const markNotificationAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };



  const isDateBlocked = (dateStr: string) => {
    return blockedPeriods.some(b => dateStr >= b.start_date && dateStr <= b.end_date);
  };

  const fetchGoal = async () => {
    const { data, error } = await supabase
      .from('business_goals')
      .select('*')
      .eq('month', currentMonthStr)
      .single();

    if (data) {
      setMonthlyGoal(data);
    } else {
      setMonthlyGoal({ month: currentMonthStr, target_amount: 0 });
    }
  };

  const handleUpdateGoal = async () => {
    const amount = parseFloat(newGoalValue);
    if (isNaN(amount)) return;

    try {
      const { error } = await supabase
        .from('business_goals')
        .upsert({ month: currentMonthStr, target_amount: amount }, { onConflict: 'month' });

      if (error) throw error;
      setMonthlyGoal({ month: currentMonthStr, target_amount: amount });
      setShowGoalModal(false);
      alert('Meta atualizada!');
    } catch (err: any) {
      alert('Erro ao atualizar meta: ' + err.message);
    }
  };

  const handleConfirmAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', id);
      if (error) throw error;
      fetchData();
      alert('Agendamento confirmado!');
    } catch (err: any) {
      alert('Erro ao confirmar: ' + err.message);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;

      await supabase.from('notifications').insert([{
        title: 'Agendamento Cancelado',
        message: `O agendamento ${id.slice(0, 8)} foi cancelado.`,
        type: 'system',
        read: false
      }]);

      fetchData();
      alert('Agendamento cancelado!');
    } catch (err: any) {
      alert('Erro ao cancelar: ' + err.message);
    }
  };

  const handleFinalizePayment = async (method: string) => {
    if (!showPaymentModal) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
          payment_method: method,
          payment_status: 'paid',
          completed_at: new Date().toISOString()
        })
        .eq('id', showPaymentModal.id);

      if (error) throw error;

      setShowPaymentModal(null);
      setPaymentPhase('selection');
      setReceivedCash('');
      fetchData(); // Refresh list
      alert(`Pagamento em ${method} registrado com sucesso!`);
    } catch (err: any) {
      alert('Erro ao registrar pagamento: ' + err.message);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showServiceModal?.id) {
        // Update
        const { error } = await supabase
          .from('services')
          .update(newServiceData)
          .eq('id', showServiceModal.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('services')
          .insert([newServiceData]);
        if (error) throw error;
      }
      setShowServiceModal(null);
      fetchData();
      alert('Serviço salvo com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar serviço: ' + err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
      alert('Serviço excluído!');
    } catch (err: any) {
      alert('Erro ao excluir serviço: ' + err.message);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setChangingPassword(true);
    try {
      const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwdError) throw pwdError;

      const { error: metaError } = await supabase.auth.updateUser({
        data: { first_login: false }
      });
      if (metaError) throw metaError;

      setMustChangePassword(false);
      alert('Senha alterada com sucesso!');
    } catch (err: any) {
      alert('Erro ao alterar senha: ' + err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const fetchBlockedPeriods = async () => {
    const { data } = await supabase.from('blocked_periods').select('*').order('start_date', { ascending: false });
    if (data) setBlockedPeriods(data);
  };

  const fetchData = async () => {
    setLoading(true);

    // OTIMIZAÇÃO: Carregar histórico recente (últimos 6 meses) e futuro
    const today = new Date();
    const pastDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const startDateStr = pastDate.toISOString().split('T')[0];

    const [servicesRes, appointmentsRes, customersRes, blocksRes] = await Promise.all([
      supabase.from('services').select('*').order('name'),
      supabase.from('appointments').select('*')
        .gte('date', startDateStr) // Filtro de performance (últimos 6 meses)
        .order('date', { ascending: false })
        .order('time', { ascending: false }),
      supabase.from('customers').select('*').order('visits_count', { ascending: false }),
      supabase.from('blocked_periods').select('*').order('start_date', { ascending: false })
    ]);

    if (!servicesRes.error) setServices(servicesRes.data || []);

    if (!appointmentsRes.error) {
      const allApps = appointmentsRes.data || [];
      setAppointments(allApps);

      // --- SYSTEM INTELLIGENCE: Auto-Complete Past Appointments ---
      const now = new Date();
      const todayStr = getLocalTodayStr();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const pastAppsToUpdate = allApps.filter(app => {
        if (app.status !== 'confirmed' && app.status !== 'pending') return false;
        if (app.date < todayStr) return true;
        if (app.date === todayStr) {
          const [appHour, appMinute] = app.time.split(':').map(Number);
          if (appHour < currentHour) return true;
          if (appHour === currentHour && appMinute < currentMinute) return true;
        }
        return false;
      });

      if (pastAppsToUpdate.length > 0) {
        // Auto-update in background
        const updates = pastAppsToUpdate.map(app =>
          supabase.from('appointments').update({ status: 'completed' }).eq('id', app.id)
        );

        await Promise.all(updates);

        const newNotif: AppNotification = {
          id: crypto.randomUUID(),
          title: '🤖 Inteligência Artificial',
          message: `${pastAppsToUpdate.length} agendamentos passados foram finalizados automaticamente.`,
          type: 'system',
          created_at: new Date().toISOString(),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);

        setAppointments(prev => prev.map(a =>
          pastAppsToUpdate.find(pa => pa.id === a.id) ? { ...a, status: 'completed' } : a
        ));
      }
    }

    if (!customersRes.error) setCustomers(customersRes.data || []);
    if (!blocksRes.error) setBlockedPeriods(blocksRes.data || []);

    setLoading(false);
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockData.start_date || !newBlockData.end_date) {
      alert('Selecione as datas de início e fim.');
      return;
    }
    try {
      const { error } = await supabase
        .from('blocked_periods')
        .insert([newBlockData]);

      if (error) throw error;

      alert('Bloqueio adicionado com sucesso!');
      setShowBlockModal(false);
      setNewBlockData({ start_date: '', end_date: '', reason: '' });
      fetchBlockedPeriods();
    } catch (err: any) {
      alert('Erro ao adicionar bloqueio: ' + err.message);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este bloqueio?')) return;
    try {
      const { error } = await supabase.from('blocked_periods').delete().eq('id', id);
      if (error) throw error;
      fetchBlockedPeriods();
    } catch (err: any) {
      alert('Erro ao remover bloqueio: ' + err.message);
    }
  };

  const handleSaveWalkIn = async () => {
    if (!walkInData.service_id || !walkInData.time || !walkInData.date) {
      alert('Preencha os dados obrigatórios (Serviço, Data e Hora)!');
      return;
    }

    try {
      const selectedService = services.find(s => s.id === walkInData.service_id);
      if (!selectedService) return;

      // Check for conflicts
      const { data: conflict } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', walkInData.date)
        .eq('time', walkInData.time)
        .neq('status', 'cancelled');

      if (conflict && conflict.length > 0) {
        const confirmForce = confirm(`⚠️ ATENÇÃO: Já existe um agendamento para ${walkInData.time}!\n\nCliente: ${conflict[0].client_name}\nServiço: ${conflict[0].service_name}\n\nDeseja forçar o encaixe (Sobrepor horários)?`);
        if (!confirmForce) return;
      }

      const { error } = await supabase
        .from('appointments')
        .insert([{
          client_name: walkInData.client_name || 'Cliente Avulso',
          client_phone: '00000000000',
          service_id: walkInData.service_id,
          service_name: selectedService.name,
          price: selectedService.price,
          date: walkInData.date,
          time: walkInData.time,
          status: 'confirmed',
          payment_status: 'pending'
        }]);

      if (error) throw error;

      setShowWalkInModal(false);
      fetchData();
      setWalkInData({
        client_name: 'Cliente Avulso',
        service_id: '',
        time: '',
        date: getLocalTodayStr()
      });
      alert('Entrada Rápida confirmada com sucesso!');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const handleEditService = (service: Service) => {
    setNewServiceData(service);
    setShowServiceModal(service);
  };


  const renderSection = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (section) {
      case DashboardSection.OVERVIEW:
        return (
          <OverviewView
            appointments={appointments}
            monthlyGoal={monthlyGoal}
            setMonthlyGoal={setMonthlyGoal}
            setShowGoalModal={setShowGoalModal}
            setNewGoalValue={setNewGoalValue}
            walkInData={walkInData}
            setWalkInData={setWalkInData}
            setShowWalkInModal={setShowWalkInModal}
            setSection={setSection}
            fetchData={fetchData}
            setShowBlockModal={setShowBlockModal}
            handleCancelAppointment={handleCancelAppointment}
            setShowPaymentModal={setShowPaymentModal}
            getLocalTodayStr={getLocalTodayStr}
          />
        );
      case DashboardSection.ANALYTICS:
        return <AnalyticsOverview />;

      case DashboardSection.SERVICES:
        return (
          <ServiceManager
            services={services}
            onAddService={() => {
              setNewServiceData({ name: '', price: 0, duration: 30, description: '' });
              setShowServiceModal({ id: '', name: '', price: 0, duration: 30, description: '', image_url: '' });
            }}
            onEditService={handleEditService}
            onDeleteService={handleDeleteService}
          />
        );


      case DashboardSection.AGENDA:
        return (
          <div className="space-y-8 animate-fade-in shadow-inner">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Agenda do Mês</h3>
                <p className="text-stone-500 text-sm mt-1">Visualize seus compromissos e planeje seu dia.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setWalkInData({ ...walkInData, date: getLocalTodayStr() });
                    setShowWalkInModal(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  <span className="material-icons text-sm">flash_on</span> Entrada Rápida
                </button>
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all uppercase tracking-widest"
                >
                  <span className="material-icons text-sm">block</span> Bloqueios
                </button>
              </div>
            </div>

            <AgendaView
              appointments={appointments}
              viewDate={viewDate}
              setViewDate={setViewDate}
              currentMonthStr={currentMonthStr}
            />
          </div>
        );
      case DashboardSection.REPORTS:
        return (
          <FinancialReportsView
            appointments={appointments}
            currentMonthStr={currentMonthStr}
          />
        );
      case DashboardSection.CLIENTS:
        return (
          <ClientsView customers={customers} appointments={appointments} />
        );

      case DashboardSection.BLOCKS:
        return (
          <BlocksView
            blockedPeriods={blockedPeriods}
            setShowBlockModal={setShowBlockModal}
            handleDeleteBlock={handleDeleteBlock}
          />
        );
      default:
        return <div>Em breve...</div>;
    }
  };

  if (mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 rustic-texture relative overflow-hidden bg-stone-950">
        <div className="absolute inset-0 z-0 opacity-20 capitalize">
          <img alt="Barbershop" className="w-full h-full object-cover" src={IMAGES.ADMIN_BG} />
        </div>
        <div className="relative z-10 w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4 shadow-xl shadow-primary/20">
              <span className="material-icons text-white text-4xl">security</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Segurança Exigida</h1>
            <p className="text-stone-400 mt-2 text-sm italic">Como esse é seu primeiro acesso, você precisa definir uma senha pessoal.</p>
          </div>

          <div className="bg-white dark:bg-stone-900 shadow-2xl rounded-2xl p-8 border border-white/5">
            <form className="space-y-6" onSubmit={handlePasswordChange}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 dark:text-stone-300 block uppercase tracking-wider">Nova Senha</label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">lock_open</span>
                  <input
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                    placeholder="Mínimo 6 caracteres"
                    type="password"
                  />
                </div>
              </div>
              <button
                disabled={changingPassword}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                type="submit"
              >
                {changingPassword ? (
                  <span className="material-icons animate-spin">sync</span>
                ) : (
                  <>
                    <span>DEFINIR SENHA E ACESSAR</span>
                    <span className="material-icons text-sm">rocket_launch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-stone-950 w-full">
      <Sidebar
        section={section}
        setSection={setSection}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        onLogout={onLogout}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 w-full">
        <header className="h-16 sm:h-20 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-white/5 px-4 sm:px-8 flex justify-between items-center z-20">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 hover:bg-stone-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="material-icons text-stone-600 dark:text-stone-400">menu</span>
            </button>

            <div className="flex flex-col">
              <h2 className="text-lg sm:text-2xl font-bold text-stone-800 dark:text-white flex items-center gap-2">
                <span className="hidden sm:inline">Painel do Proprietário</span>
                <span className="sm:hidden">Painel</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest hidden md:inline-block">Admin</span>
              </h2>
              <p className="text-stone-400 text-xs font-medium hidden sm:block">Bem-vindo, Rodrigo Silva (v2.1 - GitHub Connected)</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <div className="relative group">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/5 rounded-2xl text-stone-400 hover:text-primary transition-all shadow-sm hover:shadow-lg active:scale-95 group"
              >
                <span className="material-icons">notifications</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-stone-900 animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-auto mt-0 sm:mt-4 w-auto sm:w-80 bg-white dark:bg-stone-900 rounded-2xl sm:rounded-[2rem] shadow-2xl border border-stone-100 dark:border-white/5 z-50 overflow-hidden animate-slide-up origin-top-right">
                  <div className="p-6 border-b border-stone-50 dark:border-white/5 flex justify-between items-center bg-stone-50/50 dark:bg-white/2">
                    <h4 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-widest">Notificações</h4>
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Real-time</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.read && markNotificationAsRead(n.id)}
                          className={`p-5 border-b border-stone-50 dark:border-white/5 last:border-0 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative group/n ${!n.read ? 'bg-primary/2' : ''}`}
                        >
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'booking' ? 'bg-primary/10 text-primary' :
                              n.type === 'payment' ? 'bg-accent-green/10 text-accent-green' :
                                'bg-blue-500/10 text-blue-500'
                              }`}>
                              <span className="material-icons text-xl">
                                {n.type === 'booking' ? 'event' : n.type === 'payment' ? 'payments' : 'info'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-black text-stone-900 dark:text-white mb-1 uppercase tracking-tight ${!n.read ? 'pr-4' : ''}`}>
                                {n.title}
                              </p>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <p className="text-[9px] text-stone-400 font-bold uppercase mt-2 tracking-widest">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!n.read && (
                              <div className="absolute top-6 right-6 w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <span className="material-icons text-stone-200 dark:text-white/10 text-5xl mb-4">notifications_none</span>
                        <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Nenhuma notificação</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-stone-50 dark:bg-white/2 border-t border-stone-50 dark:border-white/5 text-center">
                    <button className="text-[10px] font-black text-stone-400 hover:text-stone-600 uppercase tracking-widest transition-colors">Ver tudo</button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-stone-100 dark:border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-stone-800 dark:text-white">Rodrigo Silva</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-tighter">Barbeiro Master</p>
              </div>
              <img src={IMAGES.BARBER_PROFILE} className="w-10 h-10 rounded-full border-2 border-primary object-cover shadow-lg shadow-primary/20" alt="Profile" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 custom-scrollbar bg-stone-50 dark:bg-stone-950/50">
          <div className="max-w-7xl mx-auto space-y-8">
            {renderSection()}
          </div>
        </div>
      </main>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/5">
            <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tight">Definir Meta Mensal</h3>
            <p className="text-stone-500 text-sm mb-6">Quanto a Barbearia Zero 7 deve faturar em {monthlyGoal?.month}?</p>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">R$</span>
                <input
                  type="number"
                  value={newGoalValue}
                  onChange={(e) => setNewGoalValue(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-xl dark:text-white"
                  placeholder="0,00"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-4 text-stone-500 font-bold uppercase tracking-widest text-xs hover:bg-stone-100 dark:hover:bg-white/5 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateGoal}
                  className="flex-1 py-4 bg-primary text-white font-bold uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Salvar Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]">
          <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/10 relative overflow-hidden">

            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Finalizar</h3>
                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">{showPaymentModal.client_name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] mb-1">Total</p>
                <p className="text-3xl font-black text-primary drop-shadow-sm">R$ {Number(showPaymentModal.price).toFixed(2)}</p>
              </div>
            </div>

            <div className="relative z-10">
              {paymentPhase === 'selection' && (
                <div className="space-y-4 animate-slide-up">
                  <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.15em] mb-4 text-center">Forma de Pagamento</p>
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => setPaymentPhase('pix')}
                      className="group flex items-center gap-5 p-5 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-primary/10 rounded-2xl border border-stone-100 dark:border-white/5 transition-all active:scale-95"
                    >
                      <div className="p-4 bg-teal-500 text-white rounded-2xl shadow-xl shadow-teal-500/20 group-hover:scale-110 transition-transform">
                        <span className="material-icons text-2xl">qr_code_2</span>
                      </div>
                      <div className="text-left">
                        <span className="block font-black text-stone-900 dark:text-white uppercase tracking-tight text-lg">PIX</span>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Inicia QR Code</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentPhase('cash')}
                      className="group flex items-center gap-5 p-5 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-primary/20 rounded-2xl border border-stone-100 dark:border-white/5 transition-all active:scale-95"
                    >
                      <div className="p-4 bg-accent-green text-white rounded-2xl shadow-xl shadow-accent-green/20 group-hover:scale-110 transition-transform">
                        <span className="material-icons text-2xl">payments</span>
                      </div>
                      <div className="text-left">
                        <span className="block font-black text-stone-900 dark:text-white uppercase tracking-tight text-lg">Dinheiro</span>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Calculadora de Troco</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleFinalizePayment('bank')}
                      className="group flex items-center gap-5 p-5 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-primary/20 rounded-2xl border border-stone-100 dark:border-white/5 transition-all active:scale-95"
                    >
                      <div className="p-4 bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <span className="material-icons text-2xl">credit_card</span>
                      </div>
                      <div className="text-left">
                        <span className="block font-black text-stone-900 dark:text-white uppercase tracking-tight text-lg">Cartão</span>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Débito / Crédito</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {paymentPhase === 'pix' && (
                <div className="space-y-6 text-center animate-fade-in">
                  <div className="bg-stone-50 dark:bg-stone-950 p-6 rounded-3xl border border-stone-100 dark:border-white/5 inline-block mx-auto mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126360014br.gov.bcb.pix0114${pixKey}5204000053039865405${Number(showPaymentModal.price).toFixed(2)}5802BR5915ZERO7BARBEARIA6005CRATO62070503***6304`}
                      alt="PIX QR Code"
                      className="w-48 h-48 rounded-lg shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Chave PIX:</p>
                    <div className="bg-stone-100 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between border border-dashed border-stone-300 dark:border-white/20">
                      <span className="text-stone-800 dark:text-stone-100 font-bold text-sm tracking-tight">{pixKey}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pixKey);
                          alert('Chave copiada!');
                        }}
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <span className="material-icons text-primary text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setPaymentPhase('selection')}
                      className="flex-1 py-4 text-stone-400 font-black uppercase tracking-widest text-[10px] hover:text-stone-600 transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => handleFinalizePayment('pix')}
                      className="flex-[2] py-4 bg-teal-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Confirmar Recebimento
                    </button>
                  </div>
                </div>
              )}

              {paymentPhase === 'cash' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Valor Recebido:</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-stone-400 text-xl">R$</span>
                        <input
                          autoFocus
                          type="number"
                          value={receivedCash}
                          onChange={(e) => setReceivedCash(e.target.value)}
                          className="w-full pl-12 pr-6 py-5 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-4 focus:ring-accent-green/20 outline-none text-2xl font-black text-stone-900 dark:text-white"
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    {parseFloat(receivedCash) >= Number(showPaymentModal.price) && (
                      <div className="bg-accent-green/10 p-6 rounded-3xl border border-accent-green/20 text-center animate-bounce-subtle">
                        <p className="text-accent-green text-[10px] font-black uppercase tracking-widest mb-1">Troco para Devolver:</p>
                        <p className="text-4xl font-black text-accent-green drop-shadow-sm">
                          R$ {(parseFloat(receivedCash) - Number(showPaymentModal.price)).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setPaymentPhase('selection')}
                      className="flex-1 py-4 text-stone-400 font-black uppercase tracking-widest text-[10px] hover:text-stone-600 transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      disabled={!receivedCash || parseFloat(receivedCash) < Number(showPaymentModal.price)}
                      onClick={() => handleFinalizePayment('cash')}
                      className={`flex-[2] py-4 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all ${parseFloat(receivedCash) >= Number(showPaymentModal.price)
                        ? 'bg-accent-green text-white shadow-accent-green/20 hover:scale-105 active:scale-95'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                    >
                      Finalizar Venda
                    </button>
                  </div>
                </div>
              )}
            </div>

            {paymentPhase === 'selection' && (
              <button
                onClick={() => {
                  setShowPaymentModal(null);
                  setPaymentPhase('selection');
                }}
                className="w-full mt-8 py-2 text-stone-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-stone-600 transition-colors"
              >
                Voltar sem registrar
              </button>
            )}
          </div>
        </div>
      )}

      {showServiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tighter leading-none mb-2">
                  {showServiceModal.id ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
                <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest italic">Personalize seu catálogo</p>
              </div>
              <button
                onClick={() => setShowServiceModal(null)}
                className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                type="button"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nome do Serviço</label>
                  <input
                    required
                    value={newServiceData.name || ''}
                    onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none font-bold dark:text-white"
                    placeholder="Ex: Corte de Cabelo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Preço (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={newServiceData.price || ''}
                      onChange={(e) => setNewServiceData({ ...newServiceData, price: parseFloat(e.target.value) })}
                      className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none font-bold dark:text-white"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Duração (Min)</label>
                    <input
                      required
                      type="number"
                      value={newServiceData.duration || ''}
                      onChange={(e) => setNewServiceData({ ...newServiceData, duration: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none font-bold dark:text-white"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Descrição Curta</label>
                  <textarea
                    required
                    value={newServiceData.description || ''}
                    onChange={(e) => setNewServiceData({ ...newServiceData, description: e.target.value })}
                    className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none font-bold dark:text-white resize-none h-24"
                    placeholder="Fale um pouco sobre o serviço..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(null)}
                  className="flex-1 py-4 text-stone-400 font-black uppercase tracking-widest text-[10px] hover:text-stone-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {showServiceModal.id ? 'Salvar Alterações' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Walk-In Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-3 relative z-10">
              <span className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <span className="material-icons">flash_on</span>
              </span>
              Entrada Rápida
            </h3>

            <div className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-1">Cliente (Opcional)</label>
                <input
                  type="text"
                  value={walkInData.client_name}
                  onChange={e => setWalkInData({ ...walkInData, client_name: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Nome do Cliente ou 'Cliente Avulso'"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-1">Data</label>
                  <input
                    type="date"
                    value={walkInData.date}
                    onChange={e => setWalkInData({ ...walkInData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-1">Hora</label>
                  <input
                    type="time"
                    value={walkInData.time}
                    onChange={e => setWalkInData({ ...walkInData, time: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-1">Serviço</label>
                <div className="relative">
                  <select
                    value={walkInData.service_id}
                    onChange={e => setWalkInData({ ...walkInData, service_id: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Selecione um serviço...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - R$ {Number(s.price).toFixed(2)}</option>
                    ))}
                  </select>
                  <span className="material-icons absolute right-4 top-3.5 text-stone-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setShowWalkInModal(false)}
                  className="flex-1 py-4 bg-stone-100 dark:bg-white/5 text-stone-500 font-black rounded-xl hover:bg-stone-200 dark:hover:bg-white/10 transition-colors uppercase text-[10px] tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveWalkIn}
                  className="flex-1 py-4 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                  <span className="material-icons text-sm">check</span> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/5">
            <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tight">Bloquear Agenda</h3>
            <p className="text-stone-500 text-sm mb-6">Defina um período para fechar a barbearia (férias, folgas, imprevistos).</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Início</label>
                  <input type="date" className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl font-bold dark:text-white" value={newBlockData.start_date} onChange={e => setNewBlockData({ ...newBlockData, start_date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Fim</label>
                  <input type="date" className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl font-bold dark:text-white" value={newBlockData.end_date} onChange={e => setNewBlockData({ ...newBlockData, end_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Motivo (Opcional)</label>
                <input type="text" className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl font-bold dark:text-white" placeholder="Ex: Férias Coletivas" value={newBlockData.reason} onChange={e => setNewBlockData({ ...newBlockData, reason: e.target.value })} />
              </div>

              <div className="max-h-32 overflow-y-auto space-y-2 pt-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Bloqueios Ativos</label>
                {blockedPeriods.length === 0 && <p className="text-xs text-stone-500 italic">Nenhum bloqueio ativo.</p>}
                {blockedPeriods.map(b => (
                  <div key={b.id} className="flex justify-between items-center bg-stone-50 dark:bg-white/5 p-2 rounded-lg">
                    <div>
                      <p className="text-xs font-bold dark:text-white">{b.start_date} até {b.end_date}</p>
                      <p className="text-[10px] text-stone-500">{b.reason || 'Sem motivo'}</p>
                    </div>
                    <button onClick={() => handleDeleteBlock(b.id)} className="text-red-500 hover:text-red-600"><span className="material-icons text-sm">delete</span></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowBlockModal(false)} className="flex-1 py-3 text-stone-500 font-bold uppercase tracking-widest text-xs hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-all">Cancelar</button>
                <button onClick={handleAddBlock} className="flex-1 py-3 bg-red-500 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-500/20 hover:scale-105 transition-all">Bloquear</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardView;
