import React, { useMemo } from 'react';
import { cn } from '../lib/utils';

type Props = {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
};

export const useTheme = () => {
  const theme = useMemo(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }, []);
  return theme === 'dark' ? 'dark' : 'light';
};

const SettingsBase: React.FC<Props> = ({ title, children, onBack }) => {
  const theme = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-[#0b1220]' : 'bg-slate-50')}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className={cn('rounded-3xl shadow-sm border overflow-hidden', isDark ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900')}>
          <div className={cn('px-6 py-4 border-b flex items-center gap-3', isDark ? 'border-slate-800' : 'border-slate-100')}>
            {onBack && (
              <button
                onClick={onBack}
                className={cn('px-3 py-2 rounded-lg text-sm font-semibold', isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}
                aria-label="Geri"
              >
                ←
              </button>
            )}
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          <div className="p-6 space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsBase;
