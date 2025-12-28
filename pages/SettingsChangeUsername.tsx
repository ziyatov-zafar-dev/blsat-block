import React, { useState } from 'react';
import SettingsBase, { useTheme } from './SettingsBase';
import { cn } from '../lib/utils';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const SettingsChangeUsername: React.FC = () => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const trimmed = newUsername.trim();
    if (trimmed.length < 3 || trimmed.length > 40) {
      setError('Kullanıcı adı 3 ile 40 karakter arasında olmalı');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.changeUsername(trimmed);
      if (res.data.success) {
        const me = await authService.getMe();
        setUser(me.data.data);
        setSuccess('Kullanıcı adı güncellendi');
      } else {
        setError(res.data.message || 'Kullanıcı adı değiştirilemedi');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Kullanıcı adı değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsBase title="Kullanıcı adı değiştir" onBack={() => navigate(-1)}>
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
        <div className="space-y-1">
          <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Yeni kullanıcı adı</label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={40}
            className={cn(
              'w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors',
              isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900'
            )}
            placeholder="yeni_kullanici_adi"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>3-40 karakter, harf/rakam kullanın.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50',
            isDark ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
          )}
        >
          {loading ? 'Kaydediliyor...' : 'Kullanıcı adını güncelle'}
        </button>
      </form>
    </SettingsBase>
  );
};

export default SettingsChangeUsername;
