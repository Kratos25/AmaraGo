export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration: number;
  rating: number;
  discountedPrice: number;
  originalPrice: number;
  imageUrl?: string;
}

export interface Filters {
  minRating: number;
  minPrice: number;
  maxPrice: number;
  minDuration: number;
  maxDuration: number;
  sortBy: string;
}