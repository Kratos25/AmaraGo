"use client";

import { useState, useEffect } from 'react';
import { Loader2, Star, MapPin, Phone, Award, Shield } from 'lucide-react';
import { providersAPI, type ProviderProfile } from '@/lib/api';

interface ProviderDetailsPanelProps {
  providerId: string;
}

export function ProviderDetailsPanel({ providerId }: ProviderDetailsPanelProps) {
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    providersAPI
      .getById(providerId)
      .then(({ data }) => setProvider(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
        <Loader2 size={12} className="animate-spin text-[#e5849c]" /> Loading provider details…
      </div>
    );
  }

  if (!provider) return null;

  return (
    <div className="space-y-3">
      {/* Provider header */}
      <div className="flex items-center gap-3 p-3 bg-[#fdf0f3] rounded-xl border border-[#e5849c]/20">
        <div className="w-12 h-12 rounded-full bg-white border-2 border-[#e5849c]/20 flex items-center justify-center text-xl overflow-hidden shrink-0">
          {provider.profile_image ? (
            <img src={provider.profile_image} alt={provider.name} className="w-full h-full object-cover" />
          ) : (
            '👤'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#111827] text-sm">{provider.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] text-gray-600">
              {provider.rating?.toFixed(1) ?? '–'} · {provider.total_jobs} jobs done
            </span>
          </div>
          {provider.location && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              <MapPin size={9} className="inline mr-0.5" />
              {provider.location}
            </p>
          )}
        </div>
        {provider.phone && (
          <a
            href={`tel:${provider.phone}`}
            className="w-9 h-9 rounded-full bg-[#e5849c] flex items-center justify-center shrink-0 hover:bg-[#d4738b] transition-colors"
          >
            <Phone size={14} className="text-white" />
          </a>
        )}
      </div>

      {/* Experience + jobs stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
          <p className="text-base font-black text-[#e5849c]">{provider.experience_years}</p>
          <p className="text-[10px] text-gray-400">Years Exp.</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
          <p className="text-base font-black text-[#e5849c]">{provider.total_jobs}</p>
          <p className="text-[10px] text-gray-400">Jobs Done</p>
        </div>
      </div>

      {provider.bio && (
        <p className="text-xs text-gray-500 leading-relaxed px-1">{provider.bio}</p>
      )}

      {/* Certifications */}
      {provider.certifications && provider.certifications.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Award size={10} /> Certifications
          </p>
          <div className="space-y-1">
            {provider.certifications.map((cert, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl"
              >
                <Shield size={11} className="text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-700 truncate">{cert.name}</p>
                  {cert.issuer && (
                    <p className="text-[10px] text-gray-400 truncate">
                      {cert.issuer}
                      {cert.year ? ` · ${cert.year}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services offered */}
      {provider.services_offered && provider.services_offered.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Services Offered
          </p>
          <div className="flex flex-wrap gap-1">
            {provider.services_offered.map((s, i) => (
              <span
                key={i}
                className="text-[10px] font-medium px-2.5 py-1 bg-[#fdf0f3] text-[#e5849c] border border-[#e5849c]/20 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}