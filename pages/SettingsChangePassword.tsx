import React, { useState } from 'react';
import SettingsBase, { useTheme } from './SettingsBase';
import { cn } from '../lib/utils';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const SettingsChangePassword: React.FC = () => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdVisible, setPwdVisible] = useState({ old: false, neu: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.changePassword(pwdForm);
      if (res.data.success && res.data.data) {
        setAuth({
          accessToken: (res.data.data as any).accessToken,
          refreshToken: (res.data.data as any).refreshToken,
        });
        setSuccess(res.data.message || 'Şifre güncellendi');
        setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(res.data.message || 'Şifre değiştirilemedi');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Şifre değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof pwdForm,
    visibleKey: keyof typeof pwdVisible
  ) => (
    <div className="space-y-1">
      <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-300' : 'text-slate-600')}>
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type={pwdVisible[visibleKey] ? 'text' : 'password'}
          required
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors',
            isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900'
          )}
          value={pwdForm[key]}
          onChange={(e) => setPwdForm({ ...pwdForm, [key]: e.target.value })}
        />
        <button
          type="button"
          onClick={() => setPwdVisible((v) => ({ ...v, [visibleKey]: !v[visibleKey] }))}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md',
            isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          )}
          aria-label={pwdVisible[visibleKey] ? 'Şifreyi gizle' : 'Şifreyi göster'}
        >
          {pwdVisible[visibleKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <SettingsBase title="Şifre değiştir" onBack={() => navigate(-1)}>
      <div className={cn('p-5 rounded-2xl border space-y-4', isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white')}>
        <div className="space-y-1">
          <div className={cn('font-semibold', isDark ? 'text-slate-100' : 'text-slate-800')}>Güvenlik ipucu</div>
          <p className={cn('text-xs', isDark ? 'text-slate-300' : 'text-slate-600')}>
            Şifrenizi kimseyle paylaşmayın, en az 8 karakter ve harf/rakam kombinasyonu kullanın.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className={cn('p-3 rounded-lg text-sm', isDark ? 'bg-red-900/30 text-red-200 border border-red-800/60' : 'bg-red-50 text-red-600 border border-red-100')}>
              {error}
            </div>
          )}
          {success && (
            <div className={cn('p-3 rounded-lg text-sm', isDark ? 'bg-emerald-900/30 text-emerald-200 border border-emerald-800/60' : 'bg-emerald-50 text-emerald-600 border border-emerald-100')}>
              {success}
            </div>
          )}
          {field('Eski şifre', 'oldPassword', 'old')}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('Yeni şifre', 'newPassword', 'neu')}
            {field('Yeni şifre (tekrar)', 'confirmPassword', 'confirm')}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50',
              isDark ? 'bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 shadow-indigo-900/50' : 'bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 shadow-indigo-200'
            )}
          >
            {loading ? 'Şifre değiştiriliyor...' : 'Şifreyi güncelle'}
          </button>
        </form>
      </div>
    </SettingsBase>
  );
};

export default SettingsChangePassword;
