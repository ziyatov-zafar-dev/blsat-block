
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Mail, ArrowLeft, Send, Lock } from 'lucide-react';

type Step = 'request' | 'reset' | 'done';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('request');
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.forgotPassword(identifier);
      if (res.data.success) {
        setStep('reset');
      } else {
        setError(res.data.message || 'Kod gonderilemedi');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kod gonderilemedi');
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Sifreler eslesmiyor');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.resetPassword({ identifier, code, newPassword });
      if (res.data.success) {
        setStep('done');
      } else {
        setError(res.data.message || 'Sifre sifirlanmadi');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sifre sifirlanmadi');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <button onClick={() => navigate('/signin')} className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} /> Geri
        </button>

        {step === 'done' ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Sifre yenilendi</h2>
            <p className="text-slate-500 text-sm mb-8">
              Yeni sifreniz ile giris yapabilirsiniz.
            </p>
            <Link to="/signin" className="w-full block py-4 bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 text-center">
              Giris sayfasina don
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Sifreyi mi unuttunuz?</h2>
              {step === 'request' ? (
                <p className="text-slate-500 mt-2 text-sm">
                  Hesabinizin e-posta adresi veya kullanici adini girin, size kod gonderecegiz.
                </p>
              ) : (
                <p className="text-slate-500 mt-2 text-sm">
                  <b>{identifier}</b> icin gonderdigimiz 6 haneli kodni ve yeni sifreni gir.
                </p>
              )}
            </div>

            <form onSubmit={step === 'request' ? handleSendCode : handleReset} className="space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block ml-1">E-posta veya Kullanici adi</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="ornek@mail.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={step === 'reset'}
                  />
                </div>
              </div>

              {step === 'reset' && (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block ml-1">Kod</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block ml-1">Yeni sifre</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="password"
                          required
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="********"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block ml-1">Yeni sifre (tekrar)</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="password"
                          required
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="********"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {loading
                  ? step === 'request' ? 'Kod gonderiliyor...' : 'Sifre yenileniyor...'
                  : step === 'request' ? 'Kodu gonder' : 'Sifreyi yenile'}
              </button>

              {step === 'reset' && (
                <button
                  type="button"
                  onClick={(e) => handleSendCode(e as any)}
                  className="w-full py-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline-offset-2 underline"
                  disabled={loading}
                >
                  Kodu tekrar gonder
                </button>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
