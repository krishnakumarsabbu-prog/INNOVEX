import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import { userApi } from '../api/endpoints';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  isLoadingUsers: boolean;
  loginAs: (userOrId: string | User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'innovex_current_user_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    userApi.getAll()
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
          const savedId = localStorage.getItem(STORAGE_KEY);
          if (savedId) {
            const matched = data.find((u) => u.id === savedId);
            if (matched) {
              setCurrentUser(matched);
              return;
            }
          }
          // Default to first user if available
          if (data.length > 0) {
            setCurrentUser(data[0]);
            localStorage.setItem(STORAGE_KEY, data[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load users for auth context:', err);
      })
      .finally(() => {
        setIsLoadingUsers(false);
      });
  }, []);

  const loginAs = (userOrId: string | User) => {
    if (typeof userOrId === 'string') {
      const user = users.find((u) => u.id === userOrId || u.email.toLowerCase() === userOrId.toLowerCase());
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEY, user.id);
      }
    } else {
      setCurrentUser(userOrId);
      localStorage.setItem(STORAGE_KEY, userOrId.id);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, users, isLoadingUsers, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
