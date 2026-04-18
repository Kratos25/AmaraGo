import axios from 'axios';
import { auth } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

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

// Global response error handler — shows readable toasts for auth/permission errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error?.response?.status;
    const detail  = error?.response?.data?.detail as string | undefined;

    if (status === 401) {
      toast({
        title: 'Session expired',
        description: 'Please log in again to continue.',
        variant: 'destructive',
      });
    } else if (status === 403) {
      // Use the backend's detail message when available, otherwise a generic one.
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