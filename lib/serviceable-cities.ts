/**
 * Serviceable cities configuration for AmaraGo.
 * Add new cities here as the service expands.
 */

export const SERVICEABLE_CITIES = [
  'Mumbai',
//   'Thane',
  'Navi Mumbai',
] as const;

export type ServiceableCity = (typeof SERVICEABLE_CITIES)[number];

/** Areas within each serviceable city shown as suggestions */
export const CITY_AREAS: Record<string, string[]> = {
  Mumbai: [
    'Bandra, Mumbai',
    'Andheri, Mumbai',
    'Juhu, Mumbai',
    'Powai, Mumbai',
    'Borivali, Mumbai',
    'Malad, Mumbai',
    'Goregaon, Mumbai',
    'Dadar, Mumbai',
    'Worli, Mumbai',
    'Lower Parel, Mumbai',
  ],
  Thane: [
    'Thane West, Thane',
    'Thane East, Thane',
    'Ghodbunder Road, Thane',
    'Majiwada, Thane',
  ],
  'Navi Mumbai': [
    'Vashi, Navi Mumbai',
    'Kharghar, Navi Mumbai',
    'Nerul, Navi Mumbai',
    'Belapur, Navi Mumbai',
  ],
};

/** Extract the city from a location string like "Bandra, Mumbai" → "Mumbai" */
export function extractCity(location: string): string {
  const parts = location.split(',');
  return parts[parts.length - 1].trim();
}

/** Returns true if the location string's city is in the serviceable list */
export function isCityServiceable(location: string): boolean {
  if (!location) return false;
  const city = extractCity(location);
  return SERVICEABLE_CITIES.some(
    (c) => c.toLowerCase() === city.toLowerCase()
  );
}

/** All areas flattened for search suggestions */
export const ALL_AREAS: string[] = Object.values(CITY_AREAS).flat();
