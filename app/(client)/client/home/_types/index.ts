// app/(client)/client/home/_types/index.ts

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: string;
  rating: number;
  discountedPrice: string;
  originalPrice: string;
  discount: string;
  rawDiscounted: number;
  rawOriginal: number;
  imageUrl?: string;
}