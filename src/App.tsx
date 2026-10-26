import React from 'react';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { ToastProvider } from '@/components/feedback/ToastContext';
import { AppShell } from '@/components/layout/AppShell';
import { LoginView } from '@/features/auth/LoginView';

function MainApp() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <AppShell />;
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
