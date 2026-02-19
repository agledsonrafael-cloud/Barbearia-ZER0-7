
import React, { useState, useEffect } from 'react';
import { IMAGES, BUSINESS_CONFIG } from '../constants';
import { Service, BlockedPeriod } from '../types';
import { supabase } from '../lib/supabase';

interface BookingViewProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const BookingView: React.FC<BookingViewProps> = ({ onComplete, onBack }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewDate, setViewDate] = useState(new Date()); // Controls which month is displayed
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [customerData, setCustomerData] = useState<{ visits_count: number } | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);

  useEffect(() => {
    fetchBlockedPeriods();
  }, []);

  const fetchBlockedPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_periods')
        .select('*');
      if (data) setBlockedPeriods(data);
    } catch (e) {
      console.error('Error fetching blocked periods', e);
    }
  };

  // Helper: get month/year info
  const getMonthName = (date: Date) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[date.getMonth()];
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Build a proper YYYY-MM-DD string from viewDate + selectedDay
  const buildDateStr = (day: number) => {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Check if a day is in the past
  const isDayPast = (day: number) => {
    const today = new Date();
    const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isDayBlocked = (day: number) => {
    const dateStr = buildDateStr(day);
    return blockedPeriods.some(b => dateStr >= b.start_date && dateStr <= b.end_date);
  };

  // Check if a time slot is in the past (for today only)
  const isTimePast = (time: string) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDay);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate.getTime() !== today.getTime()) return false;
    const [h, m] = time.split(':').map(Number);
    return h < now.getHours() || (h === now.getHours() && m <= now.getMinutes());
  };

  // Check if current month is being viewed
  const isCurrentMonth = () => {
    const now = new Date();
    return viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() === now.getMonth();
  };

  // Navigate months
  const goToPrevMonth = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    // Don't allow navigating to past months
    if (prevMonth.getFullYear() < now.getFullYear() ||
      (prevMonth.getFullYear() === now.getFullYear() && prevMonth.getMonth() < now.getMonth())) {
      return;
    }
    setViewDate(prevMonth);
    setSelectedDay(1);
    setSelectedTime(null);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    // Allow up to 12 months in the future
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 12);
    if (nextMonth > maxDate) return;
    setViewDate(nextMonth);
    setSelectedDay(1);
    setSelectedTime(null);
  };

  // Format phone number: (XX) XXXXX-XXXX
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Format date for display: "15 de Fevereiro, 2026"
  const formatDisplayDate = () => {
    return `${selectedDay} de ${getMonthName(viewDate)}, ${viewDate.getFullYear()}`;
  };

  // Format date for notification: "15/02"
  const formatNotificationDate = () => {
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    return `${selectedDay}/${m}`;
  };


  // Check if barbershop is open now
  const isOpenNow = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Dom
    const hour = now.getHours();

    // Check if current day is unrelated to working days
    // Note: JS getDay() returns 0 for Sunday. config uses same.
    if (!BUSINESS_CONFIG.WORKING_DAYS.includes(day)) return false;

    return hour >= BUSINESS_CONFIG.OPENING_HOUR && hour < BUSINESS_CONFIG.CLOSING_HOUR;
  };

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching services:', error);
      } else {
        setServices(data || []);
      }
      setLoading(false);
    };

    const fetchBlockedPeriods = async () => {
      const { data } = await supabase.from('blocked_periods').select('*');
      if (data) setBlockedPeriods(data);
    };

    fetchServices();
    fetchBlockedPeriods();
  }, []);

  useEffect(() => {
    const fetchBookedTimes = async () => {
      setFetchingSlots(true);
      const dateStr = buildDateStr(selectedDay);
      const { data, error } = await supabase
        .rpc('get_busy_slots', { query_date: dateStr });

      if (error) {
        console.error('Error fetching booked times:', error);
      } else {
        // The RPC returns { slot_time: "HH:mm" } objects
        // Our RPC returns TABLE(slot_time text), so data is [{ slot_time: "10:00" }, ...]
        setBookedTimes(data?.map((item: any) => item.slot_time) || []);
      }
      setFetchingSlots(false);
    };

    fetchBookedTimes();
    setSelectedTime(null);
  }, [selectedDay, viewDate]);

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const { data, error } = await supabase
          .rpc('get_customer_loyalty', { phone_number: cleanPhone })
          .maybeSingle();

        if (data) {
          const customerData = data as any; // Cast to any to avoid unknown type error
          setCustomerData(customerData);
          setIsNewCustomer(false);
          if (!formData.name && customerData.name) {
            setFormData(prev => ({ ...prev, name: customerData.name }));
          }
        } else {
          setCustomerData(null);
          setIsNewCustomer(true);
        }
      }
    };

    fetchLoyaltyData();
  }, [formData.phone]);

  // Generate time slots based on config
  const timeSlots = [];
  for (let i = BUSINESS_CONFIG.OPENING_HOUR; i < BUSINESS_CONFIG.CLOSING_HOUR; i++) {
    timeSlots.push(`${String(i).padStart(2, '0')}:00`);
  }
  const availableSlots = timeSlots.filter(slot => !bookedTimes.includes(slot) && !isTimePast(slot));

  const handleConfirm = async () => {
    if (!selectedService || !selectedTime || !formData.name || !formData.phone) return;

    setSubmitting(true);
    const dateStr = buildDateStr(selectedDay);

    try {
      // SECURITY: Check-Before-Book
      // Verifies if the slot is still available milliseconds before confirming
      const { data: conflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('date', dateStr)
        .eq('time', selectedTime)
        .neq('status', 'cancelled')
        .maybeSingle();

      if (conflict) {
        alert('⚠️ Este horário acabou de ser reservado por outro cliente.\n\nPor favor, escolha outro horário.');
        setSubmitting(false);
        // Refresh booked times
        const { data: apps } = await supabase
          .from('appointments')
          .select('time')
          .eq('date', dateStr)
          .neq('status', 'cancelled');
        if (apps) setBookedTimes(apps.map(a => a.time));
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_name: formData.name,
            client_phone: formData.phone.replace(/\D/g, ''),
            service_id: selectedService.id,
            service_name: selectedService.name,
            price: selectedService.price,
            date: dateStr,
            time: selectedTime,
            status: 'confirmed'
          }
        ])
        .select();

      if (error) throw error;

      // Notification with dynamic date
      await supabase
        .from('notifications')
        .insert([{
          title: 'Novo Agendamento!',
          message: `${formData.name} agendou ${selectedService.name} para o dia ${formatNotificationDate()} às ${selectedTime}`,
          type: 'booking',
          read: false
        }]);

      onComplete({
        service: selectedService,
        date: formatDisplayDate(),
        time: selectedTime,
        customer: formData
      });
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Erro ao realizar o agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDay = getFirstDayOfWeek(viewDate);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Mini Header */}
      <header className="border-b border-primary/10 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={onBack}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl">07</div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-primary uppercase">Barbearia ZERO 7</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
            <span className={`flex items-center gap-1 ${isOpenNow() ? 'text-accent-green' : 'text-red-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isOpenNow() ? 'bg-accent-green' : 'bg-red-500'}`}></span>
              <span>{isOpenNow() ? 'Aberto agora' : 'Fechado'}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
          {/* Form Side */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8 lg:space-y-12">

            {/* Step 1: Services */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</span>
                <h2 className="text-2xl font-bold">Escolha o Serviço</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {services.map(service => (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`group cursor-pointer border-2 p-4 sm:p-6 rounded-xl transition-all relative overflow-hidden active:scale-95 ${selectedService?.id === service.id ? 'border-primary bg-primary/5' : 'border-primary/10 hover:border-primary bg-white'
                      }`}
                  >
                    <div className="mb-4 text-primary group-hover:scale-110 transition-transform">
                      <span className="material-icons text-4xl">{service.icon || 'content_cut'}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{service.name}</h3>
                    <p className="text-sm opacity-60 mb-4 h-10 line-clamp-2">{service.description}</p>
                    <span className="text-accent-green font-bold">R$ {Number(service.price).toFixed(2)}</span>
                    {selectedService?.id === service.id && (
                      <div className="absolute top-2 right-2">
                        <span className="material-icons text-primary">check_circle</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Step 2: Date and Time */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</span>
                <h2 className="text-2xl font-bold">Data e Horário</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 bg-white dark:bg-stone-900/40 p-4 sm:p-6 rounded-xl border border-primary/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-primary">{getMonthName(viewDate)} {viewDate.getFullYear()}</h4>
                    <div className="flex gap-2 text-stone-400">
                      <span
                        className={`material-icons cursor-pointer ${isCurrentMonth() ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary'}`}
                        onClick={goToPrevMonth}
                      >chevron_left</span>
                      <span
                        className="material-icons cursor-pointer hover:text-primary"
                        onClick={goToNextMonth}
                      >chevron_right</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase opacity-50 mb-2">
                    <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {/* Empty cells for days before the 1st */}
                    {[...Array(firstDay)].map((_, i) => (
                      <div key={`empty-${i}`} className="h-11 w-11 sm:h-10 sm:w-10"></div>
                    ))}
                    {[...Array(daysInMonth)].map((_, i) => {
                      const day = i + 1;
                      const past = isDayPast(day);
                      const blocked = isDayBlocked(day);
                      const isSunday = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).getDay() === 0;
                      const disabled = past || isSunday || blocked;
                      return (
                        <button
                          key={day}
                          onClick={() => !disabled && setSelectedDay(day)}
                          disabled={disabled}
                          className={`h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg transition-all text-sm sm:text-base active:scale-95 ${disabled
                            ? 'opacity-30 cursor-not-allowed text-stone-400'
                            : selectedDay === day
                              ? 'bg-primary text-white shadow-lg font-bold'
                              : 'hover:bg-primary/10 font-medium'
                            } ${blocked ? 'bg-red-50 text-red-300 border border-red-100' : ''}`}
                          title={blocked ? 'Data indisponível' : ''}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-primary mb-6 flex items-center gap-2">
                    <span className="material-icons text-sm">schedule</span> Horários Disponíveis
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 relative">
                    {fetchingSlots && (
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    )}
                    {availableSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`min-h-[44px] py-3 sm:py-2.5 border rounded-lg transition-all text-sm sm:text-base font-medium active:scale-95 ${selectedTime === time
                          ? 'bg-accent-green text-white border-accent-green shadow-lg font-bold'
                          : 'border-primary/20 hover:border-primary text-stone-700'
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                    {availableSlots.length === 0 && !fetchingSlots && (
                      <div className="col-span-3 py-4 text-center text-red-500 font-medium bg-red-50 rounded-lg border border-red-100 italic">
                        Não há horários disponíveis para este dia.
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-xs text-primary/60 italic">* Horário selecionado para {formatDisplayDate()}.</p>
                </div>
              </div>
            </section>

            {/* Step 3: Customer Info */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</span>
                <h2 className="text-2xl font-bold">Seus Dados</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-white dark:bg-stone-900/40 p-4 sm:p-6 lg:p-8 rounded-xl border border-primary/5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary block">Nome Completo</label>
                  <input
                    className="w-full min-h-[44px] bg-background-light dark:bg-stone-800 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary px-3 py-2.5 text-base"
                    placeholder="Ex: João da Silva"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary block">Telefone / WhatsApp</label>
                  <input
                    className="w-full min-h-[44px] bg-background-light dark:bg-stone-800 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary px-3 py-2.5 text-base"
                    placeholder="(85) 99999-9999"
                    type="tel"
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  {!isNewCustomer && customerData && (
                    <div className="bg-accent-green/10 border border-accent-green/20 p-4 rounded-lg flex items-center gap-3 animate-fade-in">
                      <span className="material-icons text-accent-green">verified</span>
                      <div>
                        <p className="text-sm font-bold text-accent-green">Cliente VIP Identificado!</p>
                        <p className="text-xs text-stone-600">Você já realizou {customerData.visits_count} cortes conosco.</p>
                        {customerData.visits_count % 10 === 9 && (
                          <p className="text-xs font-bold text-primary mt-1 underline">PRÓXIMO CORTE SERÁ POR NOSSA CONTA! 🎁</p>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-stone-500 italic flex items-center gap-2">
                    <span className="material-icons text-sm">loyalty</span>
                    Seu WhatsApp será usado para registrar sua fidelidade e garantir descontos exclusivos!
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Sticky Summary Card */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-6">
              <div className="bg-primary text-white p-6 sm:p-8 rounded-xl shadow-2xl overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-6">Resumo do Agendamento</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <span className="material-icons opacity-70">content_cut</span>
                      <div>
                        <p className="text-xs uppercase opacity-70 font-bold tracking-wider">Serviço</p>
                        <p className="font-medium text-lg">{selectedService?.name || 'Não selecionado'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="material-icons opacity-70">calendar_today</span>
                      <div>
                        <p className="text-xs uppercase opacity-70 font-bold tracking-wider">Data e Hora</p>
                        <p className="font-medium text-lg">{formatDisplayDate()}, às {selectedTime || '--:--'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="material-icons opacity-70">payments</span>
                      <div>
                        <p className="text-xs uppercase opacity-70 font-bold tracking-wider">Valor Estimado</p>
                        <div className="flex items-baseline gap-2">
                          <p className={`font-medium text-lg ${customerData && (customerData.visits_count % 10 === 0 && customerData.visits_count > 0) ? 'line-through opacity-50 text-sm' : 'text-white'}`}>
                            R$ {Number(selectedService?.price || 0).toFixed(2)}
                          </p>
                          {customerData && (customerData.visits_count % 10 === 0 && customerData.visits_count > 0) && (
                            <p className="font-bold text-xl text-accent-green">GRÁTIS!</p>
                          )}
                        </div>
                        {customerData && (customerData.visits_count % 10 === 0 && customerData.visits_count > 0) && (
                          <p className="text-[10px] bg-white text-accent-green px-2 py-0.5 rounded-full inline-block font-bold">PRÊMIO FIDELIDADE</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedService || !selectedTime || !formData.name || !formData.phone || submitting}
                    className="w-full min-h-[52px] bg-white text-primary py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-stone-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 text-base sm:text-sm flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span className="material-icons animate-spin">sync</span>
                    ) : (
                      <>
                        <span className="material-icons">task_alt</span>
                        <span className="hidden xs:inline">Confirmar Agendamento</span>
                        <span className="xs:hidden">Confirmar</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              </div>

              <div className="bg-accent-green/5 border border-accent-green/20 p-6 rounded-xl">
                <h4 className="text-accent-green font-bold flex items-center gap-2 mb-2">
                  <span className="material-icons text-sm">location_on</span> Onde estamos
                </h4>
                <p className="text-sm opacity-80 leading-relaxed mb-4">{BUSINESS_CONFIG.ADDRESS}</p>
                <div className="w-full h-32 rounded-lg bg-gray-200 overflow-hidden">
                  <img src={IMAGES.LOCATION_THUMB} className="w-full h-full object-cover grayscale" alt="Map" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingView;
