export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  booking_ref?: string;
  api_status: string;
  provider_id?: string;
  service: string;
  serviceImage?: string;
  expert: string;
  expertImage?: string;
  expertRating: number;
  date: string;
  time: string;
  duration: string;
  address: string;
  price: number;
  status: BookingStatus;
  hasClientReview: boolean;
  clientReviewRating?: number;
}