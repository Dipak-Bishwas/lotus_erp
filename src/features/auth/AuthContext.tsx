import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { StorageService } from '@/lib/storage';

interface AuthContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  isAdmin: boolean;
  isDeliveryBoy: boolean;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('USR-001'); // Default to Admin

  useEffect(() => {
    StorageService.init();
    const storedUsers = StorageService.getUsers();
    setUsers(storedUsers);
    
    const saved = localStorage.getItem('lotus_active_user_id');
    if (saved && storedUsers.some(u => u.user_id === saved)) {
      setCurrentUserId(saved);
    }
  }, []);

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    localStorage.setItem('lotus_active_user_id', userId);
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
