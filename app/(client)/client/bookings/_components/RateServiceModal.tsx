"use client";

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { StarPicker } from './StarPicker';

interface RateServiceModalProps {
  booking: { id: string; service: string; expert: string };
  onClose: () => void;
  onDone: (bookingId: string, rating: number, comment: string) => Promise<void>;
}

export function RateServiceModal({ booking, onClose, onDone }: RateServiceModalProps) {
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await onDone(booking.id, rating, comment.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#111827] px-6 py-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          <div className="text-3xl mb-2">⭐</div>
          <h2 className="text-white font-bold text-lg">Rate Your Experience</h2>
          <p className="text-white/50 text-xs mt-1 line-clamp-1">{booking.service}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {booking.expert && booking.expert !== 'Pending Assignment' && (
            <p className="text-center text-sm text-gray-500 mb-4">
              How was your experience with{' '}
              <span className="font-semibold text-[#1A1A1A]">{booking.expert}</span>?
            </p>
          )}

          <StarPicker value={rating} onChange={setRating} />

          {rating > 0 && (
            <p className="text-center text-sm font-semibold text-amber-500 mt-1 mb-4">
              {labels[rating]}
            </p>
          )}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your experience (optional)…"
            rows={3}
            maxLength={500}
            className="w-full mt-3 px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-none focus:outline-none focus:border-[#e5849c] transition-colors"
          />

          <button
            disabled={!rating || submitting}
            onClick={submit}
            className="mt-4 w-full h-12 rounded-2xl bg-[#111827] hover:bg-[#1f2937] disabled:opacity-40 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Submit Review</>}
          </button>
        </div>
      </div>
    </div>
  );
}