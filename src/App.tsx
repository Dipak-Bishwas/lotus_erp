import React from 'react';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ToastProvider } from '@/components/feedback/ToastContext';
import { AppShell } from '@/components/layout/AppShell';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
