
import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { supabase } from '../lib/supabase';
import { Service } from '../types';

interface HomeViewProps {
  onStartBooking: () => void;
  onAdminLogin: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onStartBooking, onAdminLogin }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchServices();
  }, []);

  return (
    <div className="rustic-texture min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => window.location.reload()}>
            <span className="text-lg sm:text-2xl font-extrabold text-primary tracking-tight whitespace-nowrap">Barbearia <span className="text-accent-green">ZERO 7</span></span>
          </div>
          <nav className="hidden md:flex md:flex-row md:flex-nowrap items-center gap-6 lg:gap-8 text-sm font-semibold text-stone-600 dark:text-stone-400 flex-shrink-0">
            <a className="hover:text-primary transition-colors whitespace-nowrap" href="#services">Serviços</a>
            <button className="hover:text-primary transition-colors font-bold whitespace-nowrap" onClick={onAdminLogin}>Acesso Barbeiro</button>
          </nav>
          <button
            onClick={onStartBooking}
            className="hidden sm:flex bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-primary/20 items-center gap-2 text-base flex-shrink-0 whitespace-nowrap"
          >
            <span className="material-icons text-base">event</span>
            Agendar Agora
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              <span className="material-icons text-xs">workspace_premium</span>
              Excelência desde 2019
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-stone-900 dark:text-white leading-tight mb-4 sm:mb-6">
              O melhor corte e barba no coração do <span className="text-primary italic">Ceará</span>
            </h1>
            <p className="text-base sm:text-xl text-stone-600 dark:text-stone-400 mb-6 sm:mb-10 max-w-lg leading-relaxed">
              Tradição e estilo para quem busca excelência. Um ambiente rústico e acolhedor preparado para elevar sua autoestima.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onStartBooking}
                className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-4 rounded-xl font-bold transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 group"
              >
                Agende seu Horário
                <span className="material-icons group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
              <a href="#services" className="bg-white dark:bg-stone-800 border-2 border-primary/20 hover:border-primary text-stone-800 dark:text-white px-10 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                Ver Serviços
              </a>
            </div>

          </div>
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-accent-green/10 rounded-full blur-3xl"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 transform hover:scale-[1.02] transition-transform duration-500">
              <img className="w-full h-[300px] sm:h-[400px] lg:h-[600px] object-cover" src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" alt="Barbearia Facade" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <a href="https://www.google.com/maps/search/?api=1&query=R.+Missão+Velha+-+São+Miguel,+Crato+-+CE,+63122-265" target="_blank" rel="noopener noreferrer" className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-colors cursor-pointer block">
                <div className="flex items-center gap-4 text-white">
                  <div className="p-3 bg-primary rounded-lg">
                    <span className="material-icons">location_on</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Unidade Crato</h4>
                    <p className="text-sm opacity-90">R. Missão Velha - São Miguel, Crato - CE, 63122-265</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-12 sm:py-20 bg-cream-muted dark:bg-stone-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-stone-900 dark:text-white mb-4">Nossos Serviços</h2>
            <p className="text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">Experiência completa em barbearia clássica e moderna. Escolha seu serviço e agende agora.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div key={service.id} className="bg-background-light dark:bg-background-dark p-8 rounded-2xl border border-primary/5 hover:shadow-xl transition-all group flex flex-col justify-between h-full">
                  <div>
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-icons text-3xl">{service.icon || 'content_cut'}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{service.name}</h3>
                    <p className="text-stone-600 dark:text-stone-400 mb-6 line-clamp-2">{service.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-bold text-accent-green">R$ {Number(service.price).toFixed(2)}</span>
                    <button
                      onClick={onStartBooking}
                      className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      Agendar
                      <span className="material-icons text-sm">event</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20">
        <div className="w-full px-4 sm:px-6">
          <div className="bg-primary rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <span className="material-icons text-[120px] text-white">content_cut</span>
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-8">Pronto para transformar seu visual?</h2>
              <p className="text-white/80 text-base sm:text-lg mb-8 sm:mb-12">Não perca tempo em filas. Garanta seu horário com <strong>nosso especialista</strong> em apenas alguns cliques.</p>
              <button
                onClick={onStartBooking}
                className="bg-white text-primary hover:bg-cream-muted text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-extrabold transition-all shadow-xl flex items-center justify-center gap-3 mx-auto active:scale-95"
              >
                Agendar Agora
                <span className="material-icons">calendar_month</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
            <div className="sm:col-span-2">
              <span className="text-2xl font-extrabold text-white mb-6 block">Barbearia <span className="text-primary">ZERO 7</span></span>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Contato</h4>
              <ul className="space-y-4">

                <li className="flex items-center gap-2">
                  <span className="material-icons text-sm text-primary">phone</span>
                  <a href="https://wa.me/558881841034" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                    +55 88 8184-1034
                    <span className="bg-green-500/10 text-green-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">WhatsApp</span>
                  </a>
                </li>
                <li className="flex items-center gap-2"><span className="material-icons text-sm text-primary">email</span>contato@barbeariazero7.com.br</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Links Rápidos</h4>
              <ul className="space-y-4">
                <li><button onClick={onStartBooking} className="hover:text-primary transition-colors">Agendamento Online</button></li>
                <li><button onClick={onAdminLogin} className="hover:text-primary transition-colors">Painel Administrativo</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-stone-800 text-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© 2024 Barbearia ZERO 7. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <span className="material-icons cursor-pointer hover:text-white">facebook</span>
              <span className="material-icons cursor-pointer hover:text-white">instagram</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeView;
