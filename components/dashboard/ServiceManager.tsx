
import React from 'react';
import { Service } from '../../types';

interface ServiceManagerProps {
    services: Service[];
    onAddService: () => void;
    onEditService: (service: Service) => void;
    onDeleteService: (id: string) => void;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({
    services,
    onAddService,
    onEditService,
    onDeleteService
}) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Gestão de Serviços</h3>
                    <p className="text-stone-500 text-sm mt-1">Configure os valores e o catálogo da barbearia.</p>
                </div>
                <button
                    onClick={onAddService}
                    className="bg-primary text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all outline-none uppercase text-xs tracking-widest"
                >
                    <span className="material-icons text-base">add</span> Novo Serviço
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((s) => (
                    <div key={s.id} className="bg-white dark:bg-stone-900 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] border border-stone-200 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative border-b-4 border-b-transparent hover:border-b-primary">
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="p-4 bg-stone-50 dark:bg-white/5 text-stone-400 group-hover:text-primary rounded-2xl transition-colors shadow-inner">
                                <span className="material-icons text-2xl">content_cut</span>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="bg-primary/10 text-primary font-black px-4 py-1.5 rounded-xl text-lg tracking-tighter">
                                    R$ {Number(s.price).toFixed(2)}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => onEditService(s)}
                                        className="p-2 text-stone-300 hover:text-blue-500 transition-colors"
                                        title="Editar Serviço"
                                    >
                                        <span className="material-icons text-sm">edit</span>
                                    </button>
                                    <button
                                        onClick={() => onDeleteService(s.id)}
                                        className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                                        title="Excluir Serviço"
                                    >
                                        <span className="material-icons text-sm">delete_outline</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h4 className="font-black text-stone-900 dark:text-white text-xl tracking-tight mb-2 uppercase">{s.name}</h4>
                            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-8 h-12 overflow-hidden line-clamp-2 italic">"{s.description}"</p>

                            <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-white/5">
                                <div className="flex items-center gap-2 text-stone-400">
                                    <span className="material-icons text-xs">schedule</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{s.duration} MIN</span>
                                </div>
                                {s.min_visits && s.min_visits > 0 ? (
                                    <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-600 px-3 py-1 rounded-full border border-yellow-400/20">
                                        <span className="material-icons text-xs">grade</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{s.min_visits} Visitas</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 bg-stone-100 dark:bg-white/5 text-stone-400 px-3 py-1 rounded-full">
                                        <span className="material-icons text-xs">public</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Público</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
