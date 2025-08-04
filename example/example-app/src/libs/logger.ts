// Logger library

export class Logger {
    private prefix: string;

    constructor(prefix: string = 'APP') {
        this.prefix = prefix;
    }

    log(message: string): void {
        console.log(`[${this.prefix}] ${message}`);
    }

    error(message: string): void {
        console.error(`[${this.prefix}] ERROR: ${message}`);
    }

    warn(message: string): void {
        console.warn(`[${this.prefix}] WARN: ${message}`);
    }
}

export const defaultLogger = new Logger();