// User Profile app
import { api } from '../../libs/api.ts';
import { isEmail, sanitizeInput } from '../../libs/validators.ts';
import { Logger } from '../../libs/logger.ts';

const logger = new Logger('PROFILE');

interface UserData {
    id: string;
    name?: string;
    email?: string;
}

interface UpdateData {
    name?: string;
    email?: string;
}

export class UserProfile {
    private userId: string;
    private userData: UserData | null;

    constructor(userId: string) {
        this.userId = userId;
        this.userData = null;
    }

    async load(): Promise<UserData> {
        logger.log(`Loading profile for user ${this.userId}`);
        this.userData = await api.get(`/users/${this.userId}`);
        return this.userData;
    }

    async update(data: UpdateData): Promise<UserData> {
        // Validate email
        if (data.email && !isEmail(data.email)) {
            logger.error('Invalid email format');
            throw new Error('Invalid email format');
        }

        // Sanitize inputs
        if (data.name) {
            data.name = sanitizeInput(data.name, 1, 50);
        }

        logger.log(`Updating profile for user ${this.userId}`);
        this.userData = await api.post(`/users/${this.userId}`, data);
        return this.userData;
    }
}

export function createProfile(userId: string): UserProfile {
    return new UserProfile(userId);
}