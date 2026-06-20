import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (accessToken: string, refreshToken: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    showWelcome: boolean;
    setShowWelcome: (show: boolean) => void;
    showExit: boolean;
    setShowExit: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showExit, setShowExit] = useState(false);

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = (accessToken: string, refreshToken: string, userData: User) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('sophia_force_new_session', '1');
        setUser(userData);
        setIsAuthenticated(true);
        setShowWelcome(true); // Trigger welcome transition
    };

    const logout = () => {
        setShowExit(true);

        // Wait for animation before clearing state
        setTimeout(() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('sophia_session_id');
            sessionStorage.removeItem('sophia_force_new_session');
            setUser(null);
            setIsAuthenticated(false);
            setShowExit(false);
        }, 2200); // Duration of the exit animation
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated,
            isLoading,
            showWelcome,
            setShowWelcome,
            showExit,
            setShowExit
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
