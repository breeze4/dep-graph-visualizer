// Tests for validators library
import { isEmail, isInRange, sanitizeInput } from './validators.ts';

describe('validators', () => {
    describe('isEmail', () => {
        it('should validate correct emails', () => {
            expect(isEmail('test@example.com')).toBe(true);
            expect(isEmail('user.name@domain.co.uk')).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(isEmail('invalid')).toBe(false);
            expect(isEmail('@example.com')).toBe(false);
            expect(isEmail('test@')).toBe(false);
        });
    });

    describe('isInRange', () => {
        it('should check if value is in range', () => {
            expect(isInRange(5, 0, 10)).toBe(true);
            expect(isInRange(0, 0, 10)).toBe(true);
            expect(isInRange(10, 0, 10)).toBe(true);
            expect(isInRange(-1, 0, 10)).toBe(false);
            expect(isInRange(11, 0, 10)).toBe(false);
        });
    });
});