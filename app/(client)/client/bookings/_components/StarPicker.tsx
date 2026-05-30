"use client";

import { useState } from 'react';

interface StarPickerProps {
  value: number;
  onChange: (n: number) => void;
}

export function StarPicker({ value, onChange }: StarPickerProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-3 justify-center my-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="text-4xl transition-all hover:scale-125 focus:outline-none leading-none"
        >
          <span className={n <= (hovered || value) ? 'text-amber-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  );
}