
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.forgotPassword(identifier);
      if (res.data.success) {
        setSuccess(true);
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xatolik yuz berdi');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <button onClick={() => navigate('/signin')} className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} /> Orqaga
        </button>

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Yuborildi!</h2>
            <p className="text-slate-500 text-sm mb-8">
              Parolni tiklash bo'yicha yo'riqnoma elektron pochtangizga yuborildi.
            </p>
            <Link to="/signin" className="w-full block py-4 bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100">
              Kirishga qaytish
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Parolni unutdingizmi?</h2>
              <p className="text-slate-500 mt-2 text-sm">
                Hisobingizga tegishli email manzilini kiriting va biz sizga tiklash kodini yuboramiz.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block ml-1">Email yoki Login</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="misol@mail.uz"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {loading ? 'Yuborilmoqda...' : 'Kodni yuborish'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
