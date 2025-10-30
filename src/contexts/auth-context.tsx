"use client";

import React, { createContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const router = useRouter();

  const login = useCallback((userData: User) => {
    setUser(userData);
    router.push('/');
  }, [setUser, router]);

  const logout = useCallback(() => {
    setUser(null);
    router.push('/login');
  }, [setUser, router]);

  const isAuthenticated = !!user;

  const value = { user, login, logout, isAuthenticated };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
