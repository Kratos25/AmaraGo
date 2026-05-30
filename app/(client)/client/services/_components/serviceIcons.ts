import React from 'react';
import { Scissors, Hand, Waves, Sparkles, Smile, Droplets, Palette, Feather, Star } from 'lucide-react';

export type ServiceIconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
}>;

const SERVICE_ICON: Record<string, ServiceIconComponent> = {
  hair: Scissors,
  nail: Hand,
  massage: Waves,
  spa: Sparkles,
  facial: Smile,
  skin: Droplets,
  makeup: Palette,
  wax: Feather,
};

const CATEGORY_ICON_MAP: Record<string, ServiceIconComponent> = {
  '💇': Scissors, '💅': Hand, '🧖': Waves, '✨': Sparkles,
  '💄': Palette, '🪒': Feather, '🌟': Star,
  hair: Scissors, nail: Hand, massage: Waves, spa: Sparkles,
  facial: Smile, skin: Droplets, makeup: Palette, wax: Feather,
};

export function getServiceIcon(name: string): ServiceIconComponent {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(SERVICE_ICON)) {
    if (lower.includes(key)) return Icon;
  }
  return Sparkles;
}

export function getCategoryIcon(icon: string, name: string): ServiceIconComponent {
  if (CATEGORY_ICON_MAP[icon]) return CATEGORY_ICON_MAP[icon];
  const lower = name.toLowerCase();
  for (const [key, Comp] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return Comp;
  }
  return Sparkles;
}