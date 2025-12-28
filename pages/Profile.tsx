import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, Save, User as UserIcon } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [formData, setFormData] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    birthDate: user?.birthDate || '',
  });
  const [socialLinks, setSocialLinks] = useState({
    telegram: user?.socialLinks?.telegram || '',
    instagram: user?.socialLinks?.instagram || '',
    facebook: user?.socialLinks?.facebook || '',
    linkedin: user?.socialLinks?.linkedin || '',
    twitter: user?.socialLinks?.twitter || '',
    tiktok: user?.socialLinks?.tiktok || '',
    github: user?.socialLinks?.github || '',
    gitlab: user?.socialLinks?.gitlab || '',
    stackoverflow: user?.socialLinks?.stackoverflow || '',
    youtube: user?.socialLinks?.youtube || '',
    medium: user?.socialLinks?.medium || '',
    blog: user?.socialLinks?.blog || '',
    website: user?.socialLinks?.website || '',
    portfolio: user?.socialLinks?.portfolio || '',
    resume: user?.socialLinks?.resume || '',
    email: user?.socialLinks?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const theme = useMemo(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }, []);
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const normalizeLink = (key: string, val: string) => {
        if (!val) return null;
        const trimmed = val.trim();
        if (!trimmed) return null;
        if (key === 'email') {
          if (trimmed.startsWith('mailto:')) return trimmed;
          if (trimmed.includes('@')) return `mailto:${trimmed}`;
          return trimmed || null;
        }
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return `https://${trimmed.replace(/^\/*/, '')}`;
      };
      const normalizedSocial = Object.fromEntries(
        Object.entries(socialLinks).map(([k, v]) => [k, normalizeLink(k, v)])
      );
      const filteredSocial = Object.fromEntries(
        Object.entries(normalizedSocial).filter(([, v]) => v !== undefined)
      );
      const payload = {
        ...formData,
        socialLinks: filteredSocial,
      };
      const res = await authService.updateProfile(payload);
      if (res.data.success) {
        const me = await authService.getMe();
        setUser(me.data.data);
        setSuccess(true);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Dosya boyutu 5MB'dan buyuk olmamali");
      return;
    }
    try {
      await authService.uploadAvatar(file);
      const me = await authService.getMe();
      setUser(me.data.data);
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-[#0b1220]' : 'bg-slate-50')}>
      <header className={cn('sticky top-0 z-10 border-b', isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-100')}>
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/')} className={cn('p-2 rounded-lg transition-colors', isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={cn('font-bold', isDark ? 'text-slate-100' : 'text-slate-800')}>Profili duzenle</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 py-8">
        <div className={cn('rounded-3xl shadow-sm border overflow-hidden', isDark ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900')}>
          <div className={cn('p-8 border-b text-center', isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-50 bg-slate-50/30')}>
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <div
                className={cn(
                  'w-full h-full rounded-full border-4 shadow-md flex items-center justify-center text-4xl font-bold overflow-hidden',
                  isDark ? 'border-slate-800 bg-indigo-700 text-white' : 'border-white bg-indigo-600 text-white'
                )}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.firstname?.[0] || <UserIcon />
                )}
              </div>
              <label
                className={cn(
                  'absolute bottom-0 right-0 p-2 text-white rounded-full cursor-pointer shadow-lg transition-colors',
                  isDark ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'
                )}
              >
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <h2 className={cn('text-xl font-bold', isDark ? 'text-slate-100' : 'text-slate-800')}>
              {user?.firstname} {user?.lastname}
            </h2>
            <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-slate-400')}>@{user?.username}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {success && (
              <div
                className={cn(
                  'p-4 rounded-xl flex items-center gap-3 text-sm',
                  isDark ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-50 text-emerald-600'
                )}
              >
                <CheckCircle2 size={18} />
                <span>Profil basariyla kaydedildi!</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Ad</label>
                <input
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors',
                    isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  )}
                />
              </div>
              <div className="space-y-1">
                <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Soyad</label>
                <input
                  type="text"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors',
                    isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  )}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Dogum tarihi</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors',
                  isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900'
                )}
              />
            </div>

            <div className="space-y-1 opacity-80">
              <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-500' : 'text-slate-500')}>Guncel e-posta</label>
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

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-semibold', isDark ? 'text-slate-200' : 'text-slate-800')}>Sosyal baglantilar (https zorunlu)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['telegram', 'Telegram', 'https://t.me/kullanici'],
                  ['instagram', 'Instagram', 'https://instagram.com/kullanici'],
                  ['facebook', 'Facebook', 'https://facebook.com/kullanici'],
                  ['linkedin', 'LinkedIn', 'https://linkedin.com/in/kullanici'],
                  ['twitter', 'X / Twitter', 'https://x.com/kullanici'],
                  ['tiktok', 'TikTok', 'https://www.tiktok.com/@kullanici'],
                  ['github', 'GitHub', 'https://github.com/kullanici'],
                  ['gitlab', 'GitLab', 'https://gitlab.com/kullanici'],
                  ['stackoverflow', 'Stack Overflow', 'https://stackoverflow.com/users/12345/kullanici'],
                  ['youtube', 'YouTube', 'https://youtube.com/@kullanici'],
                  ['medium', 'Medium', 'https://medium.com/@kullanici'],
                  ['blog', 'Blog', 'https://blog.ornek.com'],
                  ['website', 'Kisisel site', 'https://ornek.com'],
                  ['portfolio', 'Portfolyo', 'https://portfolio.ornek.com'],
                  ['resume', 'Ozgecmis', 'https://ornek.com/ozgecmis.pdf'],
                  ['email', 'E-posta', 'mailto:user@example.com'],
                ].map(([key, label, placeholder]) => (
                  <div key={key} className="space-y-1">
                    <label className={cn('text-xs font-bold uppercase tracking-wider ml-1', isDark ? 'text-slate-400' : 'text-slate-500')}>{label}</label>
                    <input
                      type="text"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors',
                        isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900'
                      )}
                      placeholder={placeholder}
                      value={(socialLinks as any)[key] || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-4 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50',
                isDark ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              )}
            >
              {loading ? 'Kaydediliyor...' : (
                <>
                  Kaydet
                  <Save size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
