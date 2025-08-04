// Tests for utils library
import { formatNumber, parseNumber, clamp } from './utils.ts';

describe('utils', () => {
    test('formatNumber should format numbers with commas', () => {
        expect(formatNumber(1000)).toBe('1,000');
        expect(formatNumber(1000000)).toBe('1,000,000');
    });

    test('parseNumber should parse formatted numbers', () => {
        expect(parseNumber('1,000')).toBe(1000);
        expect(parseNumber('1,000,000')).toBe(1000000);
    });

    test('clamp should limit values to range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });
});