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
  role: 'client' | 'service_provider' | 'pending_sp' | 'admin';
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
  image_url?: string;
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
  image_url?: string;
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

export interface ReviewDetail {
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface BookingItem {
  service_id?: string;
  package_id?: string;
  name: string;
  unit_price: number;
  quantity: number;
}

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
  client_review?: ReviewDetail;
  provider_review?: ReviewDetail;
  booking_ref?: string;
  items?: BookingItem[];
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

export interface ProviderDocuments {
  aadhar_url?: string;
  pan_url?: string;
  certification_docs?: string[];
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
  documents?: ProviderDocuments;
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
  active_bookings: number;
  total_revenue: number;
  pending_provider_approvals: number;
  weekly_revenue: number[];
  weekly_bookings: number[];
  weekly_labels: string[];
  booking_completion_rate: number;
  provider_fill_rate: number;
}

export interface Notification {
  id: string;
  type: 'new_booking' | 'pending_approval';
  title: string;
  message: string;
  reference_id: string;
  created_at?: string;
}

export interface ProviderNotification {
  id: string;
  type: 'new_booking' | 'new_rating' | 'booking_cancelled';
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
  }) => api.post<{ uid: string; role: string; message: string; is_approved?: boolean }>('/auth/register/provider', data),

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

  uploadThumbnail: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ url: string }>(`/services/${id}/thumbnail`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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

  uploadThumbnail: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ url: string }>(`/packages/${id}/thumbnail`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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

  /** Client rates the provider + service after job completion (1-5 stars). */
  submitProviderReview: (bookingId: string, data: { rating: number; comment?: string }) =>
    api.post<Booking>(`/bookings/${bookingId}/review`, data),

  /** Provider rates the client after job completion (1-5 stars). */
  rateClient: (bookingId: string, data: { rating: number; comment?: string }) =>
    api.post<Booking>(`/bookings/${bookingId}/rate-client`, data),

  /** Create one booking from multiple cart items (returns booking_ref like AG0001). */
  createMulti: (data: {
    items: Array<{ service_id?: string; package_id?: string; name: string; unit_price: number; quantity: number }>;
    date: string;
    time: string;
    address_id?: string;
    address_text?: string;
    payment_method: 'upi' | 'card' | 'wallet' | 'cash';
    coupon_code?: string;
    notes?: string;
  }) => api.post<Booking>('/bookings/multi', data),

  /** Edit a pending booking's date/time/address/notes. */
  update: (bookingId: string, data: {
    date?: string;
    time?: string;
    address_text?: string;
    notes?: string;
  }) => api.put<Booking>(`/bookings/${bookingId}`, data),
};

// ─── Providers ────────────────────────────────────────────────────────────────

export const providersAPI = {
  getMyProfile: () => api.get<ProviderProfile>('/providers/me'),

  updateMyProfile: (data: Partial<{
    name: string;
    phone: string;
    profile_image: string;
    bio: string;
    experience_years: number;
    services_offered: string[];
    location: string;
    certifications: Certification[];
    portfolio: PortfolioItem[];
    documents: ProviderDocuments;
  }>) => api.put<ProviderProfile>('/providers/me', data),

  toggleOnline: (is_online: boolean) =>
    api.put<ProviderProfile>('/providers/me/online', { is_online }),

  /** Upload a file via backend (bypasses Firebase Storage Rules). Returns { url } */
  uploadFile: (file: File, path: string, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ url: string }>(
      `/providers/me/upload?path=${encodeURIComponent(path)}`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (e) => { if (e.total) onProgress(Math.round((e.loaded / e.total) * 100)); }
          : undefined,
      },
    );
  },

  getMyJobs: (params?: { status?: string }) =>
    api.get<Booking[]>('/providers/me/jobs', { params }),

  getMyEarnings: () => api.get<EarningsSummary>('/providers/me/earnings'),

  getMyNotifications: () => api.get<ProviderNotification[]>('/providers/me/notifications'),

  // Admin
  list: (params?: { approved?: boolean }) =>
    api.get<ProviderProfile[]>('/providers', { params }),

  getById: (uid: string) => api.get<ProviderProfile>(`/providers/${uid}`),

  setApproval: (uid: string, approved: boolean, reason?: string) =>
    api.put(`/providers/${uid}/approval`, { approved, reason }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface ClientStats {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  profile_image?: string;
  created_at?: string;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_spend: number;
  avg_booking_value: number;
  favorite_service?: string;
  last_booking_date?: string;
  is_vip: boolean;
}

export const adminAPI = {
  getDashboard: () => api.get<DashboardStats>('/admin/dashboard'),
  listClients: () => api.get<UserProfile[]>('/admin/clients'),
  listClientsStats: () => api.get<ClientStats[]>('/admin/clients-stats'),
  getClient: (uid: string) => api.get<UserProfile>(`/admin/clients/${uid}`),
  getClientBookings: (uid: string) => api.get<Booking[]>(`/admin/clients/${uid}/bookings`),
  getNotifications: () => api.get<Notification[]>('/admin/notifications'),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItemPayload {
  service_id?: string;
  package_id?: string;
  name: string;
  price: number;
  duration?: string;
  quantity?: number;
  image_url?: string;
}

export const cartAPI = {
  get: (headers?: Record<string, string>) =>
    api.get('/cart', { headers }),
  add: (item: CartItemPayload, headers?: Record<string, string>) =>
    api.post('/cart', item, { headers }),
  update: (itemId: string, quantity: number, headers?: Record<string, string>) =>
    api.put(`/cart/${itemId}`, { quantity }, { headers }),
  remove: (itemId: string, headers?: Record<string, string>) =>
    api.delete(`/cart/${itemId}`, { headers }),
  clear: (headers?: Record<string, string>) =>
    api.delete('/cart', { headers }),
  merge: (guestId: string) =>
    api.post('/cart/merge', { guest_id: guestId }),
};

// ─── Loyalty ──────────────────────────────────────────────────────────────────

export const loyaltyAPI = {
  getMe: () => api.get('/loyalty/me'),
  getHistory: () => api.get('/loyalty/history'),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export const wishlistAPI = {
  /** Fetch the current user's wishlist (returns { wishlist: string[] }) */
  get: () => api.get<{ wishlist: string[] }>('/wishlist'),
  /** Add a service — idempotent */
  add: (serviceId: string) => api.post<{ wishlist: string[] }>(`/wishlist/${serviceId}`),
  /** Remove a service — idempotent */
  remove: (serviceId: string) => api.delete<{ wishlist: string[] }>(`/wishlist/${serviceId}`),
  /** Merge locally-stored guest IDs into the server wishlist after login */
  sync: (serviceIds: string[]) =>
    api.post<{ wishlist: string[] }>('/wishlist/sync', { service_ids: serviceIds }),
};