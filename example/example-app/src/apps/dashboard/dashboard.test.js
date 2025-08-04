// Tests for dashboard app
import dashboard, { Dashboard } from './index.ts';

describe('Dashboard', () => {
    it('should create dashboard instance', () => {
        expect(dashboard).toBeInstanceOf(Dashboard);
    });

    it('should initialize with empty stats', () => {
        const dash = new Dashboard();
        expect(dash.stats).toEqual({});
    });

    it('should have loadStats method', () => {
        const dash = new Dashboard();
        expect(typeof dash.loadStats).toBe('function');
    });
});