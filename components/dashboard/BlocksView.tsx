
import React from 'react';
import { BlockedPeriod } from '../../types';

interface BlocksViewProps {
    blockedPeriods: BlockedPeriod[];
    setShowBlockModal: (show: boolean) => void;
    handleDeleteBlock: (id: string) => void;
}

const BlocksView: React.FC<BlocksViewProps> = ({ blockedPeriods, setShowBlockModal, handleDeleteBlock }) => {
    return (
        <div className="space-y-8 animate-fade-in text-stone-900 dark:text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Gestão de Bloqueios</h3>
                    <p className="text-stone-500 text-sm mt-1">Gerencie dias de folga, feriados e férias.</p>
                </div>
                <button
                    onClick={() => setShowBlockModal(true)}
                    className="bg-red-500 text-white font-black py-3 px-6 rounded-2xl flex items-center gap-2 shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all outline-none uppercase text-xs tracking-widest"
                >
                    <span className="material-icons text-base">add_circle</span> Novo Bloqueio
                </button>
            </div>

            <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-200 dark:border-white/5 shadow-sm">
                {blockedPeriods.length === 0 ? (
                    <div className="py-12 text-center opacity-50">
                        <span className="material-icons text-4xl mb-2 text-stone-300">event_available</span>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Nenhum bloqueio ativo</p>
                        <p className="text-stone-400 text-[10px] mt-1">Sua agenda está livre.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 dark:bg-white/5 text-stone-400 font-bold uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="p-4 rounded-l-xl">Motivo</th>
                                    <th className="p-4">Início</th>
                                    <th className="p-4">Fim</th>
                                    <th className="p-4 text-right rounded-r-xl">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {blockedPeriods.map(b => (
                                    <tr key={b.id} className="border-b border-stone-100 dark:border-white/5 last:border-0 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold">{b.reason || 'Sem motivo'}</td>
                                        <td className="p-4">{b.start_date.split('-').reverse().join('/')}</td>
                                        <td className="p-4">{b.end_date.split('-').reverse().join('/')}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDeleteBlock(b.id)}
                                                className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Remover Bloqueio"
                                            >
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlocksView;
