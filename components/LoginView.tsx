
import React, { useState } from 'react';
import { IMAGES } from '../constants';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  onSuccess: () => void;
  onBack: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Erro ao processar autenticação';
      // Translate common Supabase errors
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu email antes de entrar.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Digite seu email antes de pedir a recuperação.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setSuccessMsg('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setShowResetForm(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background with Overlay */}
      <div className="fixed inset-0 z-0">
        <img alt="Barbershop" className="w-full h-full object-cover" src={IMAGES.ADMIN_BG} />
        <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm"></div>
      </div>

      <main className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4 shadow-xl">
            <span className="material-icons text-white text-4xl">content_cut</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Barbearia <span className="text-primary">ZERO 7</span></h1>
          <p className="text-stone-400 mt-2 font-light">Painel Administrativo</p>
        </div>

        <div className="bg-white dark:bg-stone-900 shadow-2xl rounded-2xl p-8 md:p-10 border border-primary/10">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-800 dark:text-white">
              {showResetForm ? 'Recuperar Senha' : 'Entrar'}
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              {showResetForm
                ? 'Insira seu email para receber o link de recuperação.'
                : 'Bem-vindo de volta! Por favor, insira seus dados.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded">
              {successMsg}
            </div>
          )}

          {showResetForm ? (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block">Email</label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">mail_outline</span>
                  <input
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:text-white"
                    placeholder="exemplo@barbearia.com"
                    type="email"
                  />
                </div>
              </div>
              <button
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                type="submit"
              >
                {loading ? (
                  <span className="material-icons animate-spin">sync</span>
                ) : (
                  <>
                    <span>ENVIAR LINK DE RECUPERAÇÃO</span>
                    <span className="material-icons text-sm">send</span>
                  </>
                )}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setShowResetForm(false); setError(null); setSuccessMsg(null); }}
                  className="text-sm text-stone-600 dark:text-stone-400 hover:text-primary transition-colors"
                >
                  Voltar ao login
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block">Email</label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">mail_outline</span>
                  <input
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:text-white"
                    placeholder="exemplo@barbearia.com"
                    type="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block">Senha</label>
                  <button
                    type="button"
                    onClick={() => { setShowResetForm(true); setError(null); setSuccessMsg(null); }}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">lock_outline</span>
                  <input
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:text-white"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
              </div>
              <button
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                type="submit"
              >
                {loading ? (
                  <span className="material-icons animate-spin">sync</span>
                ) : (
                  <>
                    <span>ENTRAR NO PAINEL</span>
                    <span className="material-icons text-sm">login</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 text-center">
            <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <span className="material-icons text-xs">arrow_back</span>
              Voltar para o site principal
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginView;
