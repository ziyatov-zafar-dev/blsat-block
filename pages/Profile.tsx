
import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { User, Camera, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    birthDate: user?.birthDate || '',
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
      const res = await authService.updateProfile(formData);
      if (res.data.success) {
        const me = await authService.getMe();
        setUser(me.data.data);
        setSuccess(true);
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Fayl hajmi 5MB dan oshmasligi kerak");
      return;
    }

    try {
      await authService.uploadAvatar(file);
      const me = await authService.getMe();
      setUser(me.data.data);
    } catch (err) {}
  };

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[#0b1220]" : "bg-slate-50")}>
      <header className={cn("sticky top-0 z-10 border-b", isDark ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-100")}>
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/')} className={cn("p-2 rounded-lg transition-colors", isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-50")}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={cn("font-bold", isDark ? "text-slate-100" : "text-slate-800")}>Profilni tahrirlash</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 py-8">
        <div className={cn("rounded-3xl shadow-sm border overflow-hidden", isDark ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-100")}>
          <div className={cn("p-8 border-b text-center", isDark ? "border-slate-800 bg-slate-900/30" : "border-slate-50 bg-slate-50/30")}>
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <div className={cn("w-full h-full rounded-full border-4 shadow-md flex items-center justify-center text-4xl font-bold overflow-hidden",
                isDark ? "border-slate-800 bg-indigo-700 text-white" : "border-white bg-indigo-600 text-white")}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : user?.firstname[0]}
              </div>
              <label className={cn("absolute bottom-0 right-0 p-2 text-white rounded-full cursor-pointer shadow-lg transition-colors",
                isDark ? "bg-indigo-600 hover:bg-indigo-500" : "bg-indigo-600 hover:bg-indigo-700")}>
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <h2 className={cn("text-xl font-bold", isDark ? "text-slate-100" : "text-slate-800")}>{user?.firstname} {user?.lastname}</h2>
            <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-400")}>@{user?.username}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {success && (
              <div className={cn("p-4 rounded-xl flex items-center gap-3 text-sm",
                isDark ? "bg-emerald-900/30 text-emerald-300 border border-emerald-800/60" : "bg-emerald-50 text-emerald-600")}>
                <CheckCircle2 size={18} />
                <span>Profil muvaffaqiyatli saqlandi!</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={cn("text-xs font-bold uppercase tracking-wider ml-1", isDark ? "text-slate-400" : "text-slate-500")}>Ism</label>
                <input type="text" value={formData.firstname} onChange={e => setFormData({...formData, firstname: e.target.value})} className={cn("w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors",
                  isDark ? "bg-slate-900 border border-slate-700 text-slate-100" : "bg-slate-50 border border-slate-200 text-slate-900")} />
              </div>
              <div className="space-y-1">
                <label className={cn("text-xs font-bold uppercase tracking-wider ml-1", isDark ? "text-slate-400" : "text-slate-500")}>Familiya</label>
                <input type="text" value={formData.lastname} onChange={e => setFormData({...formData, lastname: e.target.value})} className={cn("w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors",
                  isDark ? "bg-slate-900 border border-slate-700 text-slate-100" : "bg-slate-50 border border-slate-200 text-slate-900")} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={cn("text-xs font-bold uppercase tracking-wider ml-1", isDark ? "text-slate-400" : "text-slate-500")}>Tug'ilgan sana</label>
              <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className={cn("w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors",
                isDark ? "bg-slate-900 border border-slate-700 text-slate-100" : "bg-slate-50 border border-slate-200 text-slate-900")} />
            </div>

            <div className="space-y-1 opacity-60">
              <label className={cn("text-xs font-bold uppercase tracking-wider ml-1", isDark ? "text-slate-500" : "text-slate-500")}>Email (O'zgartirib bo'lmaydi)</label>
              <input type="email" disabled value={user?.email || ''} className={cn("w-full px-4 py-3 rounded-xl cursor-not-allowed",
                isDark ? "bg-slate-900 border border-slate-800 text-slate-500" : "bg-slate-100 border border-slate-200 text-slate-500")} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn("w-full py-4 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50",
                isDark ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200")}
            >
              {loading ? 'Saqlanmoqda...' : (
                <>
                  Saqlash
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
