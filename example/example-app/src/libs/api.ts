// API communication library
import { defaultLogger } from './logger.ts';

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async get(endpoint: string): Promise<any> {
        defaultLogger.log(`GET ${this.baseUrl}${endpoint}`);
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        return response.json();
    }

    async post(endpoint: string, data: any): Promise<any> {
        defaultLogger.log(`POST ${this.baseUrl}${endpoint}`);
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }
}

export const api = new ApiClient('/api');