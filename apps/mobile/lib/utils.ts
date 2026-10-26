import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(url: string | null | undefined) {
  return url?.replace(/^http:\/\//i, "https://") ?? null;
}

export function getTmdbPosterPath(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
