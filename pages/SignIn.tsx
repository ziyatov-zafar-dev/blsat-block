
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.signInInit({ identifier, password });
      if (res.data.success) {
        navigate('/verify', { state: { identifier, type: 'signin', maskedEmail: res.data.data.maskedEmail, password } });
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Xush kelibsiz</h1>
          <p className="text-indigo-100 opacity-90">Hisobingizga kiring</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm animate-shake">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Email yoki Foydalanuvchi nomi</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="misol@mail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700 block">Parol</label>
              <Link to="/forgot-password" title="Parolni unutdingizmi?" className="text-xs text-indigo-600 hover:underline">Unutdingizmi?</Link>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? 'Kirilmoqda...' : (
              <>
                Kirish
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-slate-500 text-sm">
              Hisobingiz yo'qmi?{' '}
              <Link to="/signup" className="text-indigo-600 font-bold hover:underline">Ro'yxatdan o'ting</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
