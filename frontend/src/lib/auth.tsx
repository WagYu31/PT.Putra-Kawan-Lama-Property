'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'customer' | 'owner' | 'admin';
    phone?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('pkwl_token');
        const savedUser = localStorage.getItem('pkwl_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const data = await api<{ token: string; user: User }>('/api/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('pkwl_token', data.token);
        localStorage.setItem('pkwl_user', JSON.stringify(data.user));
    };

    const register = async (regData: RegisterData) => {
        const data = await api<{ token: string; user: User }>('/api/auth/register', {
            method: 'POST',
            body: regData,
        });
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('pkwl_token', data.token);
        localStorage.setItem('pkwl_user', JSON.stringify(data.user));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('pkwl_token');
        localStorage.removeItem('pkwl_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
