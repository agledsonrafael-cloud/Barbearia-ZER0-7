
import React from 'react';
import { DashboardSection } from '../../types';
import { BUSINESS_CONFIG } from '../../constants';

interface SidebarProps {
    section: DashboardSection;
    setSection: (section: DashboardSection) => void;
    showMobileMenu: boolean;
    setShowMobileMenu: (show: boolean) => void;
    onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    section,
    setSection,
    showMobileMenu,
    setShowMobileMenu,
    onLogout
}) => {
    const sidebarContent = () => (
        <>
            <button
                className="lg:hidden absolute top-4 right-4 z-50 text-white bg-primary p-2 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
            >
                <span className="material-icons">close</span>
            </button>

            <div className="p-10 flex flex-col items-center border-b border-white/5 relative bg-gradient-to-b from-stone-900 to-stone-950">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-primary/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <span className="material-icons text-white text-3xl">content_cut</span>
                </div>
                <h1 className="text-2xl font-black tracking-tighter mb-1">ZERO 7</h1>
                <p className="text-[10px] uppercase tracking-[0.5em] text-stone-500 font-bold">Admin Console</p>
            </div>

            <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
                {[
                    { icon: 'dashboard', label: 'Dashboard', section: DashboardSection.OVERVIEW },
                    { icon: 'bar_chart', label: 'Analytics', section: DashboardSection.ANALYTICS },
                    { icon: 'calendar_month', label: 'Agenda', section: DashboardSection.AGENDA },
                    { icon: 'inventory_2', label: 'Serviços', section: DashboardSection.SERVICES },
                    { icon: 'groups', label: 'Clientes', section: DashboardSection.CLIENTS },
                    { icon: 'assessment', label: 'Finanças', section: DashboardSection.REPORTS },
                    { icon: 'block', label: 'Bloqueios', section: DashboardSection.BLOCKS }
                ].map((item, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setSection(item.section);
                            setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all relative group ${section === item.section
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'hover:bg-white/5 text-stone-400 hover:text-white'
                            }`}
                    >
                        <span className={`material-icons ${section === item.section ? 'text-white' : 'text-stone-500 group-hover:text-primary'}`}>{item.icon}</span>
                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        {section === item.section && (
                            <span className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"></span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-stone-800 to-stone-900 p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-icons text-4xl">support_agent</span>
                    </div>
                    <p className="text-[10px] text-stone-400 uppercase font-black mb-3 tracking-widest text-center">Precisa de Ajuda?</p>
                    <button
                        onClick={() => window.open(BUSINESS_CONFIG.WHATSAPP_LINK, '_blank')}
                        className="w-full bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 hover:scale-105 active:scale-95 text-center"
                    >
                        <span className="material-icons text-sm">whatsapp</span>
                        <span className="leading-tight">Falar no WhatsApp</span>
                    </button>
                    <p className="text-[9px] text-stone-500 text-center mt-2 font-mono opacity-60 hover:opacity-100 transition-opacity cursor-copy" title="Clique para copiar" onClick={() => { navigator.clipboard.writeText(BUSINESS_CONFIG.PHONE_CONTACT); alert('Número copiado!') }}>
                        {BUSINESS_CONFIG.PHONE_CONTACT}
                    </p>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center space-x-2 p-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl transition-all active:scale-95 border border-red-500/10 hover:border-red-500/30 group"
                >
                    <span className="material-icons text-lg group-hover:-translate-x-1 transition-transform">logout</span>
                    <span className="font-bold text-xs uppercase tracking-widest">Sair do Painel</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            <aside className="hidden lg:flex w-72 bg-stone-950 text-white flex-col border-r border-white/5 shrink-0 h-screen">
                {sidebarContent()}
            </aside>

            {showMobileMenu && (
                <>
                    <div
                        className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-md"
                        onClick={() => setShowMobileMenu(false)}
                    />
                    <aside className="fixed inset-y-0 left-0 w-80 bg-stone-950 text-white flex flex-col z-50 lg:hidden shadow-[20px_0_50px_rgba(0,0,0,0.5)] animate-slide-in border-r border-white/5">
                        {sidebarContent()}
                    </aside>
                </>
            )}

            {/* Mobile Bottom Tab Bar (Visible only on mobile when menu is closed) */}
            {!showMobileMenu && (
                <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm">
                    <div className="bg-stone-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex items-center justify-around shadow-2xl">
                        <button onClick={() => setSection(DashboardSection.OVERVIEW)} className={`p-3 rounded-xl transition-all ${section === DashboardSection.OVERVIEW ? 'bg-primary text-white' : 'text-stone-500'}`}>
                            <span className="material-icons">dashboard</span>
                        </button>
                        <button onClick={() => setSection(DashboardSection.AGENDA)} className={`p-3 rounded-xl transition-all ${section === DashboardSection.AGENDA ? 'bg-primary text-white' : 'text-stone-500'}`}>
                            <span className="material-icons">calendar_month</span>
                        </button>
                        <button onClick={() => setShowMobileMenu(true)} className="p-3 bg-white/5 text-white rounded-xl">
                            <span className="material-icons">menu</span>
                        </button>
                        <button onClick={() => setSection(DashboardSection.SERVICES)} className={`p-3 rounded-xl transition-all ${section === DashboardSection.SERVICES ? 'bg-primary text-white' : 'text-stone-500'}`}>
                            <span className="material-icons">inventory_2</span>
                        </button>
                        <button onClick={() => setSection(DashboardSection.REPORTS)} className={`p-3 rounded-xl transition-all ${section === DashboardSection.REPORTS ? 'bg-primary text-white' : 'text-stone-500'}`}>
                            <span className="material-icons">assessment</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
