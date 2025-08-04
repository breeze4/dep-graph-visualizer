// Dashboard app
import { api } from '../../libs/api.ts';
import { formatNumber } from '../../libs/utils.ts';
import { Logger } from '../../libs/logger.ts';

const logger = new Logger('DASHBOARD');

interface DashboardStats {
    users?: number;
    revenue?: number;
}

export class Dashboard {
    private stats: DashboardStats;

    constructor() {
        this.stats = {};
        logger.log('Dashboard initialized');
    }

    async loadStats(): Promise<void> {
        logger.log('Loading dashboard stats...');
        try {
            this.stats = await api.get('/stats');
            this.render();
        } catch (error: any) {
            logger.error(`Failed to load stats: ${error.message}`);
        }
    }

    render(): void {
        const container = document.getElementById('dashboard');
        if (!container) return;

        container.innerHTML = `
            <h2>Dashboard</h2>
            <p>Users: ${formatNumber(this.stats.users || 0)}</p>
            <p>Revenue: $${formatNumber(this.stats.revenue || 0)}</p>
        `;
    }
}

export default new Dashboard();