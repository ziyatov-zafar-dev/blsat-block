import React, { useEffect, useState } from 'react';
import SettingsBase, { useTheme } from './SettingsBase';
import { cn } from '../lib/utils';
import { authService } from '../services/authService';
import { ExternalLink, LogOut, MonitorSmartphone, Smartphone, Tablet, Globe, AlertTriangle, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type DeviceResponse = {
  deviceId: string;
  active: boolean;
  ip?: string;
  location?: { country?: string; city?: string; isp?: string };
  lastLoginAt?: string;
  deviceName?: string;
  me?: boolean;
  browserName?: string;
  browserVersion?: string;
  deviceType?: string;
  fullAddress?: string;
};

const SettingsDevices: React.FC = () => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.getDevices();
      if (res.data.success) {
        const list = res.data.data || [];
        list.sort((a: DeviceResponse, b: DeviceResponse) => (b.me ? 1 : 0) - (a.me ? 1 : 0));
        const meFirst = [...list.filter((d: any) => d.me), ...list.filter((d: any) => !d.me)];
        setDevices(meFirst);
      } else setError(res.data.message || 'Cihazlar alınamadı');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cihazlar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const logoutDevice = async (id: string) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await authService.logoutDevice(id);
      if (!res.data.success) {
        setError(res.data.message || 'Cihaz çıkışı yapılamadı');
      } else {
        fetchDevices();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cihaz çıkışı yapılamadı');
    } finally {
      setActionLoading(false);
    }
  };

  const logoutAll = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await authService.logoutAllDevices();
      if (!res.data.success) {
        setError(res.data.message || 'Diğer cihazlardan çıkılamadı');
      } else {
        fetchDevices();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Diğer cihazlardan çıkılamadı');
    } finally {
      setActionLoading(false);
    }
  };

  const badge = (label: string) => (
    <span className={cn('px-2 py-0.5 text-[10px] font-semibold rounded-full border', isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-600')}>
      {label}
    </span>
  );

  const deviceIcon = (type?: string) => {
    switch ((type || '').toUpperCase()) {
      case 'MOBILE':
      case 'ANDROID':
      case 'IPHONE':
        return <Smartphone size={18} />;
      case 'TABLET':
        return <Tablet size={18} />;
      default:
        return <MonitorSmartphone size={18} />;
    }
  };

  return (
    <SettingsBase title="Cihazlar" onBack={() => navigate(-1)}>
      <div className="flex flex-col items-center text-center gap-2 mb-4">
        <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', isDark ? 'bg-amber-500/20' : 'bg-amber-100')}>
          <AlertTriangle className={cn('w-7 h-7', isDark ? 'text-amber-300' : 'text-amber-600')} />
        </div>
        <h2 className={cn('text-lg font-bold', isDark ? 'text-slate-100' : 'text-slate-800')}>Aktif cihazlardan birini yonetin</h2>
        <p className={cn('text-sm max-w-xl', isDark ? 'text-slate-300' : 'text-slate-600')}>
Şu anda yalnızca sınırlı sayıda cihaz oturumuna izin verilmektedir. Yeni bir cihazda devam etmek için diğer cihazlardaki oturumlarınızı sonlandırabilirsiniz.
        </p>
        <button
          onClick={logoutAll}
          disabled={actionLoading || devices.length === 0}
          className={cn(
            'text-xs font-semibold px-3 py-2 rounded-lg border transition-colors',
            isDark ? 'border-red-800 text-red-200 hover:bg-red-900/40' : 'border-red-200 text-red-600 hover:bg-red-50',
            (actionLoading || devices.length === 0) && 'opacity-60 cursor-not-allowed'
          )}
        >
          Tüm diğer cihazlardan çık
        </button>
      </div>

      {error && (
        <div className={cn('p-3 rounded-lg text-sm mb-3', isDark ? 'bg-red-900/30 text-red-200 border border-red-800/60' : 'bg-red-50 text-red-600 border border-red-100')}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'p-4 rounded-2xl border flex gap-3 animate-pulse',
                isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white shadow-sm'
              )}
            >
              <div className={cn('w-12 h-12 rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-200')} />
              <div className="flex-1 space-y-2">
                <div className={cn('h-4 w-40 rounded', isDark ? 'bg-slate-800' : 'bg-slate-200')} />
                <div className={cn('h-3 w-24 rounded', isDark ? 'bg-slate-800' : 'bg-slate-200')} />
              </div>
            </div>
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className={cn('p-4 rounded-xl border text-sm', isDark ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-600')}>
          Kayıtlı cihaz bulunamadı.
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((d) => {
            const isMe = Boolean(d.me);
            return (
              <div
                key={d.deviceId}
                className={cn(
                  'p-4 rounded-2xl border flex flex-col gap-3 transition duration-150',
                  isMe
                    ? (isDark ? 'border-indigo-500 bg-slate-900/70' : 'border-indigo-200 bg-indigo-50/80')
                    : (isDark ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700' : 'border-slate-200 bg-white shadow-sm hover:border-indigo-200')
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white', isDark ? 'bg-gradient-to-br from-sky-600 to-indigo-600' : 'bg-gradient-to-br from-sky-500 to-indigo-500')}>
                    {deviceIcon(d.deviceType)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-100">
                      {d.deviceName || d.browserName || 'Bilinmeyen cihaz'}{d.browserVersion ? ` ${d.browserVersion}` : ''}
                    </div>
                    {d.fullAddress && (
                      <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                        {d.fullAddress}
                      </div>
                    )}
                    {d.location && (d.location.city || d.location.country || d.location.isp) && (
                      <div className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        {(d.location.city || d.location.country) ? `${d.location.city || ''} ${d.location.country || ''}`.trim() : ''}{d.location.isp ? ` • ${d.location.isp}` : ''}
                      </div>
                    )}
                    {d.lastLoginAt && (
                      <div className={cn('text-xs flex items-center gap-1', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        <Clock size={12} /> {d.lastLoginAt.replace('T', ' ')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    {isMe && <span className={cn('px-2 py-1 rounded-lg font-semibold', isDark ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-800' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')}>Bu cihaz</span>}
                    <span className={cn('px-2 py-1 rounded-lg', isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700')}>
                      {d.deviceType || 'Bilinmiyor'}
                    </span>
                    {d.active && <span className={cn('px-2 py-1 rounded-lg', isDark ? 'bg-emerald-900/30 text-emerald-200' : 'bg-emerald-50 text-emerald-600')}>Aktif</span>}
                  </div>
                </div>
                <div className="flex justify-end">
                  {!isMe && (
                    <button
                      onClick={() => setConfirmId(d.deviceId)}
                      disabled={actionLoading}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border',
                        isDark ? 'border-red-800 text-red-200 hover:bg-red-900/40' : 'border-red-200 text-red-600 hover:bg-red-50',
                        actionLoading && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <Trash2 size={14} /> Cihazdan çık
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className={cn('w-full max-w-sm rounded-2xl shadow-2xl border p-6', isDark ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900')}>
            <h4 className="text-lg font-semibold mb-2">Bu cihazdan çıkılsın mı?</h4>
            <p className={cn('text-sm mb-4', isDark ? 'text-slate-300' : 'text-slate-600')}>Bu işlem ilgili cihaz oturumunu sonlandırır.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className={cn('px-4 py-2 rounded-lg text-sm', isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}
              >
                İptal
              </button>
              <button
                onClick={() => logoutDevice(confirmId)}
                disabled={actionLoading}
                className={cn('px-4 py-2 rounded-lg text-sm text-white flex items-center gap-2', isDark ? 'bg-red-600 hover:bg-red-500' : 'bg-red-600 hover:bg-red-700', actionLoading && 'opacity-60 cursor-not-allowed')}
              >
                <Trash2 size={14} /> Çık
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsBase>
  );
};

export default SettingsDevices;


