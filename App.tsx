
import React, { useState, useCallback, useEffect } from 'react';
import { ViewType } from './types';
import HomeView from './components/HomeView';
import BookingView from './components/BookingView';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ConfirmationView from './components/ConfirmationView';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.HOME);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // If already logged in and at HOME or LOGIN, maybe go to DASHBOARD?
        // For now, just keep the current view logic.
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && currentView === ViewType.DASHBOARD) {
        setCurrentView(ViewType.HOME);
      }
    });

    return () => subscription.unsubscribe();
  }, [currentView]);

  const navigateTo = useCallback((view: ViewType, data?: any) => {
    if (data) setSelectedBookingData(data);

    // Auth Guard
    if (view === ViewType.DASHBOARD && !session) {
      setCurrentView(ViewType.LOGIN);
    } else {
      setCurrentView(view);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigateTo(ViewType.HOME);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewType.HOME:
        return <HomeView onStartBooking={() => navigateTo(ViewType.BOOKING)} onAdminLogin={() => navigateTo(ViewType.LOGIN)} />;
      case ViewType.BOOKING:
        return <BookingView onComplete={(data) => navigateTo(ViewType.CONFIRMATION, data)} onBack={() => navigateTo(ViewType.HOME)} />;
      case ViewType.CONFIRMATION:
        return <ConfirmationView data={selectedBookingData} onGoHome={() => navigateTo(ViewType.HOME)} />;
      case ViewType.LOGIN:
        return <LoginView onSuccess={() => navigateTo(ViewType.DASHBOARD)} onBack={() => navigateTo(ViewType.HOME)} />;
      case ViewType.DASHBOARD:
        if (!session) return <LoginView onSuccess={() => navigateTo(ViewType.DASHBOARD)} onBack={() => navigateTo(ViewType.HOME)} />;
        return <DashboardView onLogout={handleLogout} />;
      default:
        return <HomeView onStartBooking={() => navigateTo(ViewType.BOOKING)} onAdminLogin={() => navigateTo(ViewType.LOGIN)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      {renderView()}
    </div>
  );
};

export default App;
