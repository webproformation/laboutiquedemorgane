"use client";

import { Check } from 'lucide-react';
import { getColorValue } from '@/lib/colors';

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorSwatch({ color, isSelected, onClick, size = 'md' }: ColorSwatchProps) {
  const colorValue = getColorValue(color);

  if (!colorValue) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const checkSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const isGradient = colorValue.includes('gradient');
  const isWhiteOrLight = colorValue.toLowerCase() === '#ffffff' || colorValue.toLowerCase() === '#f5f5dc';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        rounded-full
        relative
        transition-all
        cursor-pointer
        ${isSelected ? 'ring-2 ring-offset-2 ring-[#b8933d] scale-110' : 'hover:scale-105'}
        ${isWhiteOrLight ? 'border-2 border-gray-300' : ''}
      `}
      style={{
        background: colorValue,
        boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
      title={color}
      aria-label={`Couleur ${color}`}
    >
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`
            rounded-full
            ${isWhiteOrLight || isGradient ? 'bg-gray-900' : 'bg-white'}
            p-0.5
          `}>
            <Check className={`${checkSizes[size]} ${isWhiteOrLight || isGradient ? 'text-white' : 'text-gray-900'}`} />
          </div>
        </div>
      )}
    </button>
  );
}
