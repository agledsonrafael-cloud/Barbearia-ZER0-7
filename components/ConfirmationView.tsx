
import React from 'react';
import { IMAGES } from '../constants';

interface ConfirmationViewProps {
  data: any;
  onGoHome: () => void;
}

const ConfirmationView: React.FC<ConfirmationViewProps> = ({ data, onGoHome }) => {
  const serviceName = data?.service?.name || 'Serviço';
  const dateStr = data?.date || 'Data não informada';
  const timeStr = data?.time || 'Horário não informado';

  const handleAddToCalendar = () => {
    const eventDetails = encodeURIComponent(`Corte de Cabelo: ${serviceName} na Barbearia Zero 7`);
    const eventLocation = encodeURIComponent('R. Missão Velha - São Miguel, Crato - CE, 63122-265');
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${eventDetails}&location=${eventLocation}&sf=true&output=xml`;
    window.open(googleCalendarUrl, '_blank');
  };

  const handleViewOnMaps = () => {
    const address = encodeURIComponent('BARBEARIA ZERO 7, R. Missão Velha - São Miguel, Crato - CE, 63122-265');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const handleShare = async () => {
    const text = `Agendei um ${serviceName} na Barbearia Zero 7 para o dia ${dateStr} às ${timeStr}! ✂️`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Agendamento - Barbearia Zero 7',
          text: text,
          url: window.location.origin
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Resumo do agendamento copiado para a área de transferência!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 rustic-texture relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-green/5 rounded-full blur-3xl"></div>

      <div className="text-center mb-8 max-w-2xl w-full z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
          <span className="material-icons text-primary text-5xl">check_circle</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white mb-2 tracking-tight">
          Agendamento Confirmado!
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-lg">
          Tudo pronto para o seu atendimento na Barbearia ZERO 7.
        </p>
      </div>

      <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-white/10 shadow-2xl rounded-2xl sm:rounded-2xl w-full max-w-lg overflow-hidden backdrop-blur-sm z-10">
        <div className="bg-stone-900 p-4 sm:p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-icons text-white">content_cut</span>
            </div>
            <span className="text-white font-bold tracking-wider">ZERO 7</span>
          </div>
          <span className="text-xs uppercase tracking-widest text-stone-400 font-medium">Resumo do Pedido</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-6">
            <div>
              <p className="text-xs uppercase text-stone-400 font-semibold tracking-wider mb-1">Serviço</p>
              <p className="text-lg font-bold text-stone-900 dark:text-white">{serviceName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-stone-400 font-semibold tracking-wider mb-1">Barbeiro</p>
              <p className="text-lg font-bold text-stone-900 dark:text-white">Rodrigo</p>
            </div>
            <div className="pt-4 border-t border-stone-100 dark:border-white/5">
              <p className="text-xs uppercase text-stone-400 font-semibold tracking-wider mb-1">Data</p>
              <div className="flex items-center gap-2">
                <span className="material-icons text-primary text-sm">calendar_today</span>
                <p className="text-base font-medium text-stone-900 dark:text-white">{dateStr}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-stone-100 dark:border-white/5 text-right">
              <p className="text-xs uppercase text-stone-400 font-semibold tracking-wider mb-1">Horário</p>
              <div className="flex items-center gap-2 justify-end">
                <span className="material-icons text-primary text-sm">schedule</span>
                <p className="text-base font-medium text-stone-900 dark:text-white">{timeStr}</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 flex gap-4 items-center">
            <img className="w-16 h-16 rounded-lg object-cover" src={IMAGES.LOCATION_THUMB} alt="Local" />
            <div>
              <p className="text-sm font-bold text-stone-900 dark:text-white">Unidade Crato</p>
              <p className="text-xs text-stone-500">R. Missão Velha - São Miguel, Crato - CE, 63122-265</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 pt-0 flex flex-col gap-3">
          <button
            onClick={handleAddToCalendar}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <span className="material-icons">event</span>
            Adicionar ao Calendário
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleViewOnMaps}
              className="flex-1 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-800 dark:text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-icons text-sm">map</span>
              Ver Mapa
            </button>
            <button
              onClick={handleShare}
              className="flex-1 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-800 dark:text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-icons text-sm">share</span>
              Compartilhar
            </button>
          </div>
        </div>
      </div>

      <button onClick={onGoHome} className="mt-8 text-primary hover:underline font-bold flex items-center gap-2">
        <span className="material-icons">arrow_back</span>
        Voltar para a Home
      </button>
    </div>
  );
};

export default ConfirmationView;
