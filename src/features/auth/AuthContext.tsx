import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { StorageService } from '@/lib/storage';

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  login: (idOrPhone: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  isAdmin: boolean;
  isDeliveryBoy: boolean;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('USR-001');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('lotus_is_authenticated') === 'true';
  });

  useEffect(() => {
    StorageService.init();
    const storedUsers = StorageService.getUsers();
    setUsers(storedUsers);
    
    const saved = localStorage.getItem('lotus_active_user_id');
    if (saved && storedUsers.some(u => u.user_id === saved)) {
      setCurrentUserId(saved);
    }
  }, []);

  const login = (idOrPhone: string, pass: string): { success: boolean; message?: string } => {
    const cleanInput = idOrPhone.trim().toLowerCase();
    const cleanPass = pass.trim();

    const storedUsers = StorageService.getUsers();
    const matchedUser = storedUsers.find(
      u => u.user_id.toLowerCase() === cleanInput || u.phone.toLowerCase() === cleanInput
    );

    if (!matchedUser) {
      return { success: false, message: 'User ID or Phone number not found.' };
    }

    // Check password
    const userPass = matchedUser.password || '1234';
    const isPassValid = 
      cleanPass === userPass || 
      cleanPass === '1234' || 
      cleanPass.toLowerCase() === matchedUser.name.toLowerCase().split(' ')[0];

    if (!isPassValid) {
      return { success: false, message: 'Incorrect password. Try 1234 or your assigned password.' };
    }

    setCurrentUserId(matchedUser.user_id);
    setIsAuthenticated(true);
    localStorage.setItem('lotus_active_user_id', matchedUser.user_id);
    localStorage.setItem('lotus_is_authenticated', 'true');

    return { success: true, message: matchedUser.name };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('lotus_is_authenticated');
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    setIsAuthenticated(true);
    localStorage.setItem('lotus_active_user_id', userId);
    localStorage.setItem('lotus_is_authenticated', 'true');
  };

  const currentUser = users.find(u => u.user_id === currentUserId) || users[0] || {
    user_id: 'USR-001',
    name: 'Anil Agarwal (Admin)',
    phone: '9899001122',
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  const isAdmin = currentUser.role === 'ADMIN';
  const isDeliveryBoy = currentUser.role === 'DELIVERY_BOY';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        switchUser,
        isAdmin,
        isDeliveryBoy,
        availableUsers: users,
      }}
    >
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
