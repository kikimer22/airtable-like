import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toDisplayValue = (val: unknown): string => {
  if (val === null || typeof val === 'undefined') return '';
  return String(val);
};

export const padKey = (value: number): string => value.toString().padStart(3, '0');

export const createRange = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

export function encodeCursor(id: number): string {
  return Buffer.from(id.toString()).toString('base64');
}

export function decodeCursor(cursor: string): number {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const id = parseInt(decoded, 10);
    if (Number.isNaN(id)) {
      throw new Error('Invalid cursor ID');
    }
    return id;
  } catch {
    throw new Error('Invalid cursor format');
  }
}
