import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | undefined | null): string {
  if (!price) return '';

  const decoded = price
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8364;/g, '€')
    .replace(/&euro;/g, '€')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  return decoded.trim();
}

export function decodeHtmlEntities(text: string | undefined | null): string {
  if (!text) return '';

  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8364;/g, '€')
    .replace(/&euro;/g, '€')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  return decoded.trim();
}

export function formatAttributeName(name: string | undefined | null): string {
  if (!name) return '';

  let formatted = name;

  if (formatted.startsWith('pa_')) {
    formatted = formatted.substring(3);
  }

  formatted = formatted.replace(/-/g, ' ');

  formatted = formatted.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted;
}

export function parsePrice(priceString: string | undefined | null): number {
  if (!priceString) return 0;

  const cleanPrice = priceString
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  return parseFloat(cleanPrice) || 0;
}
