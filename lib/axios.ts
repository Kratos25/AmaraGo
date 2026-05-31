import axios, { AxiosRequestConfig } from 'axios';
import { auth } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

// Extend AxiosRequestConfig to track retry attempts
interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
});

// Automatically attach Firebase token to every request.
api.interceptors.request.use(async (config) => {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler — auto-refresh token on 401, show toasts for others.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryConfig;
    const status  = error?.response?.status;
    const detail  = error?.response?.data?.detail as string | undefined;

    // ── Auto-refresh Firebase token on first 401, then retry once ───────────
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const user = auth.currentUser;
        if (user) {
          const freshToken = await user.getIdToken(/* forceRefresh */ true);
          // Update the session cookie with the fresh token
          await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: freshToken }),
          });
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${freshToken}`,
          };
          return api(originalRequest);
        }
      } catch {
        // Refresh failed — fall through to show toast and reject
      }
      toast({
        title: 'Session expired',
        description: 'Please log in again to continue.',
        variant: 'destructive',
      });
    } else if (status === 403) {
      const message =
        detail && !detail.toLowerCase().includes('access denied')
          ? detail
          : "You don't have permission to perform this action.";
      toast({
        title: 'Access denied',
        description: message,
        variant: 'destructive',
      });
    }

    return Promise.reject(error);
  },
);

export default api;