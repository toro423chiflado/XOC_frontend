import axios from 'axios';
import { api } from '../lib/axios';
import type { User } from '../types';
import type { LoginResponse as BackendLoginResponse, BackendUser } from '../types/api';

interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
}

interface OnboardingTenantResponse {
    success: boolean;
    message: string;
    owner_user: BackendUser;
    access_token: string;
    refresh_token: string;
}

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            console.log(`Intentando login para: ${email}`);
            const { data } = await api.post<BackendLoginResponse>('/api/auth/login', { email, password });

            // Map backend response to frontend format
            const { mapBackendUser } = await import('../types/api');
            return {
                access: data.access_token,
                refresh: data.refresh_token,
                user: mapBackendUser(data.user)
            };
        } catch (error: any) {
            console.error("Backend login failed:", error.response?.data || error.message);
            throw error;
        }
    },

    loginWithUsername: async (username: string, password: string): Promise<LoginResponse> => {
        try {
            console.log(`Intentando login superadmin para: ${username}`);
            const { data } = await api.post<BackendLoginResponse>('/api/auth/login', { username, password });

            const { mapBackendUser } = await import('../types/api');
            return {
                access: data.access_token,
                refresh: data.refresh_token,
                user: mapBackendUser(data.user)
            };
        } catch (error: any) {
            console.error('Backend superadmin login failed:', error.response?.data || error.message);
            throw error;
        }
    },

    register: async (companyName: string, _activationKey: string, username: string, email: string, password: string): Promise<LoginResponse> => {
        try {
            const { data } = await api.post<OnboardingTenantResponse>('/api/onboarding/tenant', {
                company_name: companyName,
                admin_email: email,
                admin_password: password,
                admin_username: username || undefined
            });

            if (!data?.access_token || !data?.refresh_token || !data?.owner_user) {
                throw new Error('Invalid onboarding response');
            }

            // Map backend response to frontend format
            const { mapBackendUser } = await import('../types/api');
            return {
                access: data.access_token,
                refresh: data.refresh_token,
                user: mapBackendUser(data.owner_user)
            };
        } catch (error: any) {
            console.error('Backend onboarding failed:', error.response?.data || error.message);
            throw error;
        }
    },

    refreshToken: async (token: string) => {
        const baseURL = api.defaults.baseURL || '';
        const refreshUrl = baseURL ? `${baseURL}/api/auth/refresh` : '/api/auth/refresh';
        const { data } = await axios.post(refreshUrl, null, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return {
            access: data.access_token,
            refresh: data.refresh_token
        };
    }
};
