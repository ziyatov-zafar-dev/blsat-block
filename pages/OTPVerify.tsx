
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { ShieldCheck, Timer, ArrowLeft } from 'lucide-react';

const OTPVerify: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth, setUser } = useAuthStore();
  
  const { identifier, type, maskedEmail, password } = location.state || {};
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(120);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (!identifier) {
      navigate('/signin');
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [identifier, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalCode = code.join('');
    if (finalCode.length < 6) return;

    setLoading(true);
    setError('');

    try {
      const payload = { identifier, code: finalCode };
      const res = type === 'signup' 
        ? await authService.verifySignUp(payload)
        : await authService.signInVerify(payload);

      if (res.data.success) {
        setAuth({ 
          accessToken: res.data.data.accessToken, 
          refreshToken: res.data.data.refreshToken 
        });
        // Fetch user data
        const userRes = await authService.getMe();
        if (userRes.data.success) {
          setUser(userRes.data.data);
          navigate('/');
        }
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kod noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !identifier) return;
    setError('');
    try {
      if (type === 'signin' && password) {
        const res = await authService.signInInit({ identifier, password });
        if (res.data.success) {
          setTimer(120);
          return;
        }
        setError(res.data.message || 'Kodni qayta yuborib bo\'lmadi');
        return;
      }
      setError('Kodni qayta yuborish uchun iltimos kirish sahifasiga qayting.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kodni qayta yuborib bo\'lmadi');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <button onClick={() => navigate(-1)} className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} /> Orqaga
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Tasdiqlash kodi</h2>
          <p className="text-slate-500 mt-2 text-sm px-4">
            6 xonali kod <b>{maskedEmail || identifier}</b> manziliga yuborildi
          </p>
        </div>

        <div className="flex justify-between gap-2 mb-8">
          {code.map((digit, idx) => (
            <input
              key={idx}
              // Added braces to ref callback to avoid returning the element (which causes TS error in React 19)
              ref={(el) => { if (el) inputs.current[idx] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 focus:bg-white outline-none transition-all"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-center text-sm mb-6">{error}</p>}

        <button
          onClick={() => handleVerify()}
          disabled={loading || code.some(d => !d)}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
          {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
        </button>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-4">
            <Timer size={16} />
            <span>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
          </div>
          <button
            onClick={handleResend}
            disabled={timer > 0}
            className="text-indigo-600 font-bold text-sm hover:underline disabled:text-slate-300 disabled:no-underline"
          >
            Kodni qayta yuborish
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerify;
