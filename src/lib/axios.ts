import axios from 'axios';

const getBaseURL = () => {
    const url = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
    return url.endsWith('/') ? url.slice(0, -1) : url;
};

const isAuthRequest = (url?: string) => {
    if (!url) return false;
    return url.includes('/api/auth/login')
        || url.includes('/api/auth/refresh')
        || url.includes('/api/onboarding/tenant');
};

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeToRefresh = (callback: (token: string | null) => void) => {
    refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (token: string | null) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
};

export const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        if (!isAuthRequest(config.url)) {
            const token = localStorage.getItem('accessToken');
            if (token && config.headers && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized (Token Expiry or Invalid)
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest(originalRequest.url)) {
            const refreshTokenValue = localStorage.getItem('refreshToken');
            if (!refreshTokenValue) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    subscribeToRefresh((newToken) => {
                        if (!newToken) {
                            reject(error);
                            return;
                        }
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        }
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const baseURL = getBaseURL();
                const refreshUrl = baseURL ? `${baseURL}/api/auth/refresh` : '/api/auth/refresh';
                const response = await axios.post(refreshUrl, null, {
                    headers: { Authorization: `Bearer ${refreshTokenValue}` }
                });

                const { access_token, refresh_token } = response.data;
                if (!access_token) {
                    notifyRefreshSubscribers(null);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                localStorage.setItem('accessToken', access_token);
                if (refresh_token) {
                    localStorage.setItem('refreshToken', refresh_token);
                }

                notifyRefreshSubscribers(access_token);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }

                return api(originalRequest);
            } catch (refreshError) {
                const status = (refreshError as any)?.response?.status;
                if (status === 401 || status === 422) {
                    notifyRefreshSubscribers(null);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
