// Define global types here

export type PlanStatus = 'DEMO' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

export interface User {
    id: string;
    username: string;
    email: string;
    companyId: string;
    role: 'ADMIN' | 'USER' | 'SUPERADMIN';
    planStatus?: PlanStatus;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface Incident {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'closed';
    timestamp: string;
}
