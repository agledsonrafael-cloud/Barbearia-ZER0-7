import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const autoUpdateAppointments = async () => {
  // Logic to fetch and update past appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .or('status.eq.confirmed,status.eq.pending');

  if (!appointments) return;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const updates = appointments
    .filter(app => {
      if (app.date < todayStr) return true;
      if (app.date === todayStr) {
        const [appHour, appMinute] = app.time.split(':').map(Number);
        if (appHour < currentHour) return true;
        if (appHour === currentHour && appMinute < currentMinute) return true;
      }
      return false;
    })
    .map(app =>
      supabase.from('appointments').update({ status: 'completed' }).eq('id', app.id)
    );

  await Promise.all(updates);
};
