
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';
import { AUTH_BASE_URL, MSG_BASE_URL } from '../config/constants';

// Separate client for refresh to avoid request/response interceptors recursion.
const refreshClient = axios.create({ baseURL: AUTH_BASE_URL });

export const authApi = axios.create({ baseURL: AUTH_BASE_URL });
export const msgApi = axios.create({ baseURL: MSG_BASE_URL });

const addAuthHeaders = (config: AxiosRequestConfig) => {
  const { accessToken, refreshToken, deviceId } = useAuthStore.getState();
  const isRefresh = config.url?.includes('/api/auth/refresh');
  config.headers = config.headers ?? {};

  if (isRefresh) {
    if (refreshToken) {
      (config.headers as any)['Authorization'] = `Bearer ${refreshToken}`;
    }
  } else if (accessToken) {
    (config.headers as any)['Authorization'] = `Bearer ${accessToken}`;
  }

  if (deviceId) {
    (config.headers as any)['X-Device-Id'] = deviceId;
  }
  return config;
};

authApi.interceptors.request.use(addAuthHeaders);
msgApi.interceptors.request.use(addAuthHeaders);

// Shared refresh state to avoid parallel refresh calls.
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const enqueue = (cb: (token: string | null) => void) => refreshQueue.push(cb);
const resolveQueue = (token: string | null) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const performRefresh = async (): Promise<{ accessToken: string; refreshToken: string }> => {
  const { refreshToken, deviceId, setAuth, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    throw new Error('Missing refresh token');
  }

  const res = await refreshClient.post('/api/auth/refresh', null, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
      'X-Device-Id': deviceId || '',
    },
  });

  if (!res.data?.success) {
    logout();
    throw new Error('Refresh failed');
  }

  const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
  setAuth({ accessToken: newAccess, refreshToken: newRefresh });
  return { accessToken: newAccess, refreshToken: newRefresh };
};

const setupRefreshInterceptor = (apiInstance: AxiosInstance) => {
  apiInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: any) => {
      const originalRequest = error.config;
      const status = error?.response?.status;
      const isRefreshCall = originalRequest?.url?.includes('/api/auth/refresh');
      const shouldAttemptRefresh = status === 401 && !originalRequest?._retry && !isRefreshCall;

      if (!shouldAttemptRefresh) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          enqueue((token) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiInstance(originalRequest));
          });
        });
      }

      try {
        isRefreshing = true;
        const { accessToken: newAccess } = await performRefresh();
        resolveQueue(newAccess);
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        return apiInstance(originalRequest);
      } catch (refreshError) {
        const { logout } = useAuthStore.getState();
        logout();
        resolveQueue(null);
        window.location.hash = '#/signin';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
};

setupRefreshInterceptor(authApi);
setupRefreshInterceptor(msgApi);
