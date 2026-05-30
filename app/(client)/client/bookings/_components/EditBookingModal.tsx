"use client";

import { useState } from 'react';
import { X, Calendar, Clock, Loader2 } from 'lucide-react';
import { bookingsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from './types';

const ALL_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
];

interface EditBookingModalProps {
  booking: Booking;
  onClose: () => void;
  onSaved: (bookingId: string, date: string, time: string) => void;
}

export function EditBookingModal({ booking, onClose, onSaved }: EditBookingModalProps) {
  const { toast }   = useToast();
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const availableSlots =
    date === today
      ? ALL_SLOTS.filter((slot) => {
          const [h, m] = slot.replace(/ AM| PM/, '').split(':').map(Number);
          const isPM   = slot.endsWith('PM');
          const slotHour =
            isPM && h !== 12 ? h + 12 : !isPM && h === 12 ? 0 : h;
          const now = new Date();
          return (
            slotHour > now.getHours() ||
            (slotHour === now.getHours() && m > now.getMinutes())
          );
        })
      : ALL_SLOTS;

  const handleSave = async () => {
    if (!date || !time) return;
    setSaving(true);
    try {
      await bookingsAPI.update(booking.id, { date, time });
      onSaved(booking.id, date, time);
      toast({ title: 'Booking updated!', description: `Rescheduled to ${date} at ${time}.` });
      onClose();
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err?.response?.data?.detail ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#111827] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-white">Edit Booking</h2>
            <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{booking.service}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <Calendar size={12} className="inline mr-1 text-[#e5849c]" /> Date
            </label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => { setDate(e.target.value); setTime(''); }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#e5849c] focus:ring-1 focus:ring-[#e5849c]/20"
            />
          </div>

          {/* Time slots */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <Clock size={12} className="inline mr-1 text-[#e5849c]" /> Time
            </label>
            {availableSlots.length === 0 ? (
              <p className="text-xs text-red-500 py-2">
                No slots available today — please pick another date.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={`py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      time === slot
                        ? 'bg-[#e5849c] border-[#e5849c] text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#e5849c] hover:text-[#e5849c]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!date || !time || saving}
            className="flex-1 py-3 rounded-2xl bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}