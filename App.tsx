
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { generateDeviceId } from './lib/utils';
import { authService } from './services/authService';

import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import OTPVerify from './pages/OTPVerify';
import ForgotPassword from './pages/ForgotPassword';
import ChatDashboard from './pages/ChatDashboard';
import Profile from './pages/Profile';
import SettingsChangeProfile from './pages/SettingsChangeProfile';
import SettingsChangeEmail from './pages/SettingsChangeEmail';
import SettingsChangePassword from './pages/SettingsChangePassword';
import SettingsChangeUsername from './pages/SettingsChangeUsername';
import SettingsDevices from './pages/SettingsDevices';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAuthStore();
  return accessToken ? <>{children}</> : <Navigate to="/signin" />;
};

const App: React.FC = () => {
  const { setDeviceId, accessToken } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const id = await generateDeviceId();
      setDeviceId(id);
      setReady(true);
    };
    init();
  }, [setDeviceId]);

  // Global Heartbeat
  useEffect(() => {
    if (!accessToken) return;
    
    const interval = setInterval(() => {
      authService.heartbeat().catch(() => {});
    }, 90000); // 90 seconds
    
    authService.heartbeat().catch(() => {});
    
    return () => clearInterval(interval);
  }, [accessToken]);

  if (!ready) return <div className="h-screen flex items-center justify-center">Yükleniyor...</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify" element={<OTPVerify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/" element={<Navigate to="/chat" replace />} />

          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatDashboard />
            </ProtectedRoute>
          } />

          <Route path="/chat/:chatId" element={
            <ProtectedRoute>
              <ChatDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/settings/change-profile" element={
            <ProtectedRoute>
              <SettingsChangeProfile />
            </ProtectedRoute>
          } />
          <Route path="/settings/change-email" element={
            <ProtectedRoute>
              <SettingsChangeEmail />
            </ProtectedRoute>
          } />
          <Route path="/settings/change-password" element={
            <ProtectedRoute>
              <SettingsChangePassword />
            </ProtectedRoute>
          } />
          <Route path="/settings/change-username" element={
            <ProtectedRoute>
              <SettingsChangeUsername />
            </ProtectedRoute>
          } />
          <Route path="/settings/device" element={
            <ProtectedRoute>
              <SettingsDevices />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
