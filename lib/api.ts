/**
 * api.ts — Typed API client using the shared Axios instance.
 *
 * Every function here corresponds to a backend endpoint.
 * Import these in pages/components instead of calling `api` directly.
 */

import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'client' | 'service_provider' | 'admin';
  profile_image?: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  active: boolean;
  service_count: number;
}

export interface Service {
  id: string;
  name: string;
  category_id: string;
  duration: string;
  base_price: number;
  discounted_price?: number;
  description: string;
  active: boolean;
  popular: boolean;
  rating: number;
  total_bookings: number;
}

export interface Package {
  id: string;
  name: string;
  tagline: string;
  services: string[];
  duration: string;
  original_price: number;
  price: number;
  savings: number;
  active: boolean;
  badge?: string;
  rating: number;
  total_bookings: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'flat';
  value: number;
  min_order: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_to: string;
  applicable_for: 'all' | 'new_users' | 'returning';
  auto_apply: boolean;
  active: boolean;
}

export interface Address {
  id: string;
  client_id: string;
  label: string;
  address: string;
  icon: string;
  is_default: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  client_id: string;
  provider_id?: string;
  service_id?: string;
  package_id?: string;
  service_name?: string;
  date: string;
  time: string;
  address: string;
  payment_method: string;
  coupon_code?: string;
  base_price: number;
  discount_amount: number;
  convenience_fee: number;
  total_price: number;
  status: BookingStatus;
  notes?: string;
  created_at?: string;
  client_name?: string;
  provider_name?: string;
  client_phone?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  year?: string;
}

export interface PortfolioItem {
  image_url: string;
  caption?: string;
}

export interface ProviderProfile {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  profile_image?: string;
  bio: string;
  experience_years: number;
  services_offered: string[];
  location: string;
  certifications: Certification[];
  portfolio: PortfolioItem[];
  rating: number;
  total_jobs: number;
  is_online: boolean;
  is_approved: boolean;
  commission_rate: number;
  created_at?: string;
}

export interface EarningTransaction {
  id: string;
  service_name: string;
  client_name: string;
  amount: number;
  commission: number;
  net_amount: number;
  date: string;
  booking_id: string;
}

export interface EarningsSummary {
  total_earned: number;
  pending_payout: number;
  total_jobs: number;
  commission_rate: number;
  this_week: number;
  this_month: number;
  transactions: EarningTransaction[];
}

export interface DashboardStats {
  active_providers: number;
  verified_clients: number;
  total_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  total_revenue: number;
  pending_provider_approvals: number;
}

export interface Notification {
  id: string;
  type: 'new_booking' | 'pending_approval';
  title: string;
  message: string;
  reference_id: string;
  created_at?: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  discount_amount: number;
  message: string;
  coupon?: Coupon;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  registerClient: (data: {
    name: string; email: string; phone: string;
    firebase_uid: string; id_token: string;
  }) => api.post<{ uid: string; role: string; message: string }>('/auth/register/client', data),

  registerProvider: (data: {
    name: string; email: string; phone: string;
    firebase_uid: string; id_token: string;
    bio?: string; experience_years?: number;
    services_offered?: string[]; location?: string;
  }) => api.post<{ uid: string; role: string; message: string }>('/auth/register/provider', data),

  me: () => api.get<UserProfile>('/auth/me'),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersAPI = {
  getMe: () => api.get<UserProfile>('/users/me'),

  updateMe: (data: { name?: string; phone?: string; profile_image?: string }) =>
    api.put<UserProfile>('/users/me', data),

  getById: (uid: string) => api.get<UserProfile>(`/users/${uid}`),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesAPI = {
  list: () => api.get<Category[]>('/categories'),

  listActive: () => api.get<Category[]>('/categories/active'),

  create: (data: { name: string; icon: string; description?: string; active?: boolean }) =>
    api.post<Category>('/categories', data),

  update: (id: string, data: Partial<{ name: string; icon: string; description: string; active: boolean }>) =>
    api.put<Category>(`/categories/${id}`, data),

  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ─── Services ─────────────────────────────────────────────────────────────────

export const servicesAPI = {
  list: (params?: { category_id?: string; popular?: boolean; active?: boolean }) =>
    api.get<Service[]>('/services', { params }),

  listAll: () => api.get<Service[]>('/services', { params: { all: true } }),

  getById: (id: string) => api.get<Service>(`/services/${id}`),

  create: (data: Omit<Service, 'id' | 'rating' | 'total_bookings'>) =>
    api.post<Service>('/services', data),

  update: (id: string, data: Partial<Omit<Service, 'id' | 'rating' | 'total_bookings'>>) =>
    api.put<Service>(`/services/${id}`, data),

  delete: (id: string) => api.delete(`/services/${id}`),
};

// ─── Packages ─────────────────────────────────────────────────────────────────

export const packagesAPI = {
  list: () => api.get<Package[]>('/packages'),

  listAll: () => api.get<Package[]>('/packages', { params: { all: true } }),

  getById: (id: string) => api.get<Package>(`/packages/${id}`),

  create: (data: Omit<Package, 'id' | 'savings' | 'rating' | 'total_bookings'>) =>
    api.post<Package>('/packages', data),

  update: (id: string, data: Partial<Omit<Package, 'id' | 'savings' | 'rating' | 'total_bookings'>>) =>
    api.put<Package>(`/packages/${id}`, data),

  delete: (id: string) => api.delete(`/packages/${id}`),
};

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const couponsAPI = {
  list: () => api.get<Coupon[]>('/coupons'),

  listActive: () => api.get<Coupon[]>('/coupons/active'),

  create: (data: Omit<Coupon, 'id' | 'used_count'>) =>
    api.post<Coupon>('/coupons', data),

  update: (id: string, data: Partial<Omit<Coupon, 'id' | 'code' | 'used_count'>>) =>
    api.put<Coupon>(`/coupons/${id}`, data),

  delete: (id: string) => api.delete(`/coupons/${id}`),

  validate: (code: string, order_amount: number) =>
    api.post<ValidateCouponResponse>('/coupons/validate', { code, order_amount }),
};

// ─── Addresses ────────────────────────────────────────────────────────────────

export const addressesAPI = {
  list: () => api.get<Address[]>('/addresses'),

  create: (data: { label: string; address: string; icon?: string; is_default?: boolean }) =>
    api.post<Address>('/addresses', data),

  update: (id: string, data: Partial<{ label: string; address: string; icon: string; is_default: boolean }>) =>
    api.put<Address>(`/addresses/${id}`, data),

  delete: (id: string) => api.delete(`/addresses/${id}`),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookingsAPI = {
  list: (params?: { status?: string }) =>
    api.get<Booking[]>('/bookings', { params }),

  getById: (id: string) => api.get<Booking>(`/bookings/${id}`),

  create: (data: {
    service_id?: string;
    package_id?: string;
    date: string;
    time: string;
    address_id?: string;
    address_text?: string;
    payment_method: 'upi' | 'card' | 'wallet' | 'cash';
    coupon_code?: string;
    notes?: string;
  }) => api.post<Booking>('/bookings', data),

  assignProvider: (bookingId: string, provider_id: string) =>
    api.put<Booking>(`/bookings/${bookingId}/assign`, { provider_id }),

  updateStatus: (bookingId: string, status: BookingStatus) =>
    api.put<Booking>(`/bookings/${bookingId}/status`, { status }),

  cancel: (bookingId: string) => api.delete(`/bookings/${bookingId}`),
};

// ─── Providers ────────────────────────────────────────────────────────────────

export const providersAPI = {
  getMyProfile: () => api.get<ProviderProfile>('/providers/me'),

  updateMyProfile: (data: Partial<{
    bio: string;
    experience_years: number;
    services_offered: string[];
    location: string;
    certifications: Certification[];
    portfolio: PortfolioItem[];
  }>) => api.put<ProviderProfile>('/providers/me', data),

  toggleOnline: (is_online: boolean) =>
    api.put<{ is_online: boolean }>('/providers/me/online', { is_online }),

  getMyJobs: (params?: { status?: string }) =>
    api.get<Booking[]>('/providers/me/jobs', { params }),

  getMyEarnings: () => api.get<EarningsSummary>('/providers/me/earnings'),

  // Admin
  list: (params?: { approved?: boolean }) =>
    api.get<ProviderProfile[]>('/providers', { params }),

  getById: (uid: string) => api.get<ProviderProfile>(`/providers/${uid}`),

  setApproval: (uid: string, approved: boolean, reason?: string) =>
    api.put(`/providers/${uid}/approval`, { approved, reason }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminAPI = {
  getDashboard: () => api.get<DashboardStats>('/admin/dashboard'),
  listClients: () => api.get<UserProfile[]>('/admin/clients'),
  getClient: (uid: string) => api.get<UserProfile>(`/admin/clients/${uid}`),
  getClientBookings: (uid: string) => api.get<Booking[]>(`/admin/clients/${uid}/bookings`),
  getNotifications: () => api.get<Notification[]>('/admin/notifications'),
};
