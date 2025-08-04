// Utility functions library

export function formatNumber(num: number): string {
    return num.toLocaleString();
}

export function parseNumber(str: string): number {
    return parseInt(str.replace(/,/g, ''), 10);
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}