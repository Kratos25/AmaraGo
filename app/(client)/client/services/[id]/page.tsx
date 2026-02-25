"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Clock, Heart, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Review {
  name: string;
  rating: number;
  comment: string;
}

interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  rating: number;
  discountedPrice: number;
  originalPrice: number;
  image: string;
  fullDescription: string;
  included: string[];
  benefits: string[];
  reviews: Review[];
}

const allServices: Service[] = [
  {
    id: 1,
    name: 'Classic Haircut + Blow Dry',
    category: 'Hair Care',
    duration: 60,
    rating: 4.8,
    discountedPrice: 899,
    originalPrice: 1200,
    image: 'https://picsum.photos/id/1015/800/600',
    fullDescription: 'Experience a premium haircut tailored to your face shape with a professional blow dry for that salon-fresh look. Our expert stylists use only high-quality products.',
    included: ['Consultation & hair analysis', 'Signature shampoo & conditioning', 'Precision haircut', 'Professional blow dry & styling', 'Aftercare tips'],
    benefits: ['Boosts confidence with a fresh look', 'Improves hair health', 'Lasts 4-6 weeks'],
    reviews: [
      { name: 'Sneha K.', rating: 5, comment: 'Best haircut I\'ve ever had in Mumbai!' },
      { name: 'Rohan P.', rating: 4, comment: 'Super quick and professional.' },
    ],
  },
  {
    id: 2,
    name: 'HydraFacial Signature',
    category: 'Skin Care',
    duration: 75,
    rating: 4.9,
    discountedPrice: 3299,
    originalPrice: 4500,
    image: 'https://picsum.photos/id/201/800/600',
    fullDescription: 'The ultimate 6-step facial that cleanses, exfoliates, extracts, and hydrates your skin using patented Vortex technology. Instant glow guaranteed!',
    included: ['Deep cleansing', 'Gentle exfoliation', 'Painless extraction', 'Hydrating serum infusion', 'LED light therapy', 'Moisturizer + SPF'],
    benefits: ['Reduces fine lines instantly', 'Improves skin texture', 'Gives glass-skin glow'],
    reviews: [{ name: 'Aarohi M.', rating: 5, comment: 'My skin has never looked this radiant!' }],
  },
  {
    id: 3,
    name: 'Gel Nail Extension Full Set',
    category: 'Nail Art',
    duration: 120,
    rating: 4.7,
    discountedPrice: 2099,
    originalPrice: 2800,
    image: 'https://picsum.photos/id/133/800/600',
    fullDescription: 'Get long, strong and beautiful nails with our premium gel extension service. Includes shaping, buffing and your choice of color or design.',
    included: ['Nail preparation', 'Gel extension application', 'Shaping & buffing', 'Cuticle care', 'High-shine top coat'],
    benefits: ['Lasts up to 4 weeks', 'Natural look and feel', 'Strengthens your natural nails'],
    reviews: [],
  },
];

export default function ServiceDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const service = allServices.find((s) => s.id === parseInt(params.id)) ?? allServices[0];
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const discount = Math.round(((service.originalPrice - service.discountedPrice) / service.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 max-w-7xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-700">
            <ArrowLeft size={28} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex gap-5">
            <button onClick={() => setIsFavorite(!isFavorite)}>
              <Heart className={`size-6 transition-colors ${isFavorite ? 'fill-[#e5849c] text-[#e5849c]' : 'text-gray-600'}`} />
            </button>
            <button><Share2 className="size-6 text-gray-600" /></button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-96 mt-16">
        <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-8 left-6 text-white">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Star className="fill-current" size={28} />
            <span className="text-4xl font-bold">{service.rating}</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight">{service.name}</h1>
          <p className="text-white/90 mt-2 flex items-center gap-2 text-xl">
            <Clock size={22} /> {service.duration} mins • {service.category}
          </p>
        </div>
        <div className="absolute top-8 right-6 bg-white px-5 py-3 rounded-3xl shadow-xl text-right">
          <div className="text-4xl font-bold text-[#e5849c]">₹{service.discountedPrice}</div>
          {discount > 0 && <div className="text-sm text-gray-500 line-through">₹{service.originalPrice}</div>}
        </div>
      </div>

      <div className="px-4 max-w-7xl mx-auto -mt-8 relative z-10">
        {/* Sticky Book Button */}
        <div className="sticky top-20 z-40 flex justify-end mb-8">
          <Button
            onClick={() => router.push(`/client/bookings/new?serviceId=${service.id}`)}
            className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white shadow-2xl px-10 py-7 text-lg rounded-3xl hover:scale-105 transition-all"
          >
            Book Now — ₹{service.discountedPrice}
          </Button>
        </div>

        {/* About */}
        <div className="bg-white rounded-3xl p-7 shadow mb-6">
          <h2 className="text-2xl font-semibold mb-5">About this service</h2>
          <p className="text-gray-600 leading-relaxed text-[17px]">{service.fullDescription}</p>
        </div>

        {/* Included */}
        <div className="bg-white rounded-3xl p-7 shadow mb-6">
          <h2 className="text-2xl font-semibold mb-6">What's Included</h2>
          <div className="space-y-5">
            {service.included.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-1 bg-pink-100 text-[#e5849c] p-2 rounded-2xl">
                  <Check size={22} />
                </div>
                <span className="text-gray-700 text-lg pt-1">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-3xl p-7 shadow mb-6">
          <h2 className="text-2xl font-semibold mb-5">Why you'll love it</h2>
          <ul className="space-y-4 text-lg text-gray-700 pl-2">
            {service.benefits.map((b, i) => <li key={i}>• {b}</li>)}
          </ul>
        </div>

        {/* Reviews */}
        {service.reviews.length > 0 && (
          <div className="bg-white rounded-3xl p-7 shadow">
            <h2 className="text-2xl font-semibold mb-6">Client Reviews</h2>
            {service.reviews.map((review, i) => (
              <div key={i} className="border-b border-gray-100 pb-7 last:border-none last:pb-0 mb-7 last:mb-0">
                <p className="font-semibold text-lg">{review.name}</p>
                <div className="flex text-amber-500 mt-1">
                  {Array.from({ length: review.rating }).map((_, idx) => (
                    <Star key={idx} size={18} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 text-gray-600 italic">"{review.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}