
export enum ViewType {
  HOME = 'HOME',
  BOOKING = 'BOOKING',
  CONFIRMATION = 'CONFIRMATION',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD'
}

export enum DashboardSection {
  OVERVIEW = 'OVERVIEW',
  ANALYTICS = 'ANALYTICS',
  AGENDA = 'AGENDA',
  CLIENTS = 'CLIENTS',
  SERVICES = 'SERVICES',
  REPORTS = 'REPORTS',
  BLOCKS = 'BLOCKS'
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  category?: string;
  popular?: boolean;
  icon?: string; // Icon might not be in DB but useful for UI
}

export interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  service_id: string | null;
  service_name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  payment_method?: 'pix' | 'bank' | 'cash';
  payment_status?: 'pending' | 'paid';
  completed_at?: string;
  barber_name?: string;
  created_at?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system';
  read: boolean;
  created_at: string;
}

export interface BlockedPeriod {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  reason?: string;
  created_at?: string;
}
