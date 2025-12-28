import React, { useState } from 'react';
import SettingsBase, { useTheme } from './SettingsBase';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const SettingsChangeEmail: React.FC = () => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [form, setForm] = useState({ newEmail: user?.email || '', code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    const trimmed = form.newEmail.trim();
    if (!trimmed) {
      setError('Yeni e-posta gerekli');
      setLoading(false);
      return;
    }
    if (user?.email && trimmed.toLowerCase() === user.email.toLowerCase()) {
      setError('Yeni e-posta mevcut e-posta ile aynı olamaz');
      setLoading(false);
      return;
    }
    setStep('verify');
    try {
      const res = await authService.changeEmailInit(trimmed);
      if (res.data.success) {
        setSuccess(res.data.message || 'Kod e-postaya gönderildi');
      } else {
        setError(res.data.message || 'Kod gönderilemedi');
        setStep('input');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Kod gönderilemedi');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authService.changeEmailVerify({
        newEmail: form.newEmail.trim(),
        code: form.code.trim(),
      });
      if (res.data.success) {
        const me = await authService.getMe();
        setUser(me.data.data);
        setSuccess(res.data.message || 'E-posta güncellendi');
        setStep('input');
        setForm({ newEmail: me.data.data?.email || '', code: '' });
      } else {
        setError(res.data.message || 'Kod doğrulanmadı');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Kod doğrulanmadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsBase title="E-posta değiştir" onBack={() => navigate(-1)}>
      <div className="space-y-3">
        <div className="space-y-1 opacity-80">
          <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-500' : 'text-slate-500')}>Güncel e-posta</label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className={cn(
              'w-full px-4 py-3 rounded-xl cursor-not-allowed',
              isDark ? 'bg-slate-900 border border-slate-800 text-slate-500' : 'bg-slate-100 border border-slate-200 text-slate-500'
            )}
          />
        </div>

        <div className={cn('p-4 rounded-2xl border', isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-800')}>Yeni e-posta</h3>
            {success && <span className={cn('text-xs font-semibold', isDark ? 'text-emerald-300' : 'text-emerald-600')}>{success}</span>}
          </div>
          {error && (
            <div className={cn('mb-3 text-sm p-3 rounded-lg',
              isDark ? 'bg-red-900/30 text-red-200 border border-red-800/60' : 'bg-red-50 text-red-600 border border-red-100')}>
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Yeni e-posta</label>
              <input
                type="email"
                required
                className={cn(
                  'w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors',
                  isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900'
                )}
                placeholder="yeni@example.com"
                value={form.newEmail}
                onChange={(e) => setForm({ ...form, newEmail: e.target.value })}
                disabled={step === 'verify' && loading}
              />
            </div>
            {step === 'verify' && (
              <div className="space-y-1">
                <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Doğrulama kodu</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className={cn(
                    'w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors',
                    isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  )}
                  placeholder="123456"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={step === 'input' ? handleSend : handleVerify}
                disabled={loading}
                className={cn(
                  'w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50',
                  isDark ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                )}
              >
                {loading
                  ? step === 'input' ? 'Kod gönderiliyor...' : 'Doğrulanıyor...'
                  : step === 'input' ? 'Kodu gönder' : 'Kodu doğrula'}
              </button>
              {step === 'verify' && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep('input');
                    setForm({ newEmail: user?.email || '', code: '' });
                    setError('');
                    setSuccess('');
                  }}
                  className={cn(
                    'text-xs font-semibold self-end underline underline-offset-2',
                    isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-800'
                  )}
                >
                  Yeni e-posta gir
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </SettingsBase>
  );
};

export default SettingsChangeEmail;
