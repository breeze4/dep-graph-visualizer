// Validation library
import { clamp } from './utils.ts';

export function isEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

export function sanitizeInput(input: string, minLength: number = 0, maxLength: number = 100): string {
    const trimmed = input.trim();
    const length = clamp(trimmed.length, minLength, maxLength);
    return trimmed.substring(0, length);
}