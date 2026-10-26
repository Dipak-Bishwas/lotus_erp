import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/feedback/ToastContext';
import {
  Flower2,
  Lock,
  User as UserIcon,
  Truck,
  ShieldCheck,
  Sparkles,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export function LoginView() {
  const { login, availableUsers } = useAuth();
  const { showToast } = useToast();

  const [idOrPhone, setIdOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!idOrPhone.trim()) {
      setError('Please enter your User ID or Phone Number');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    const result = login(idOrPhone.trim(), password.trim());
    setIsLoading(false);

    if (!result.success) {
      setError(result.message || 'Invalid credentials');
      showToast('Login Failed', result.message || 'Invalid ID or password', 'error');
    } else {
      showToast('Login Successful', 'Welcome to Lotus ERP', 'success');
    }
  };

  const handleQuickLogin = (userId: string, defaultPass: string) => {
    setIdOrPhone(userId);
    setPassword(defaultPass);
    setError('');
    const result = login(userId, defaultPass);
    if (result.success) {
      showToast('Quick Login', `Logged in as ${result.message}`, 'success');
    }
  };

  const deliveryBoys = availableUsers.filter((u) => u.role === 'DELIVERY_BOY');
  const adminUser = availableUsers.find((u) => u.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 text-white shadow-xl shadow-blue-500/30 ring-4 ring-white/10 mb-2">
            <Flower2 className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Lotus Flower ERP
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80 font-medium max-w-xs mx-auto">
            Daily Flower Delivery & Monthly Billing Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Sign In</h2>
              <p className="text-xs text-slate-500">Delivery Boy & Admin Portal</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              Route Portal
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                User ID or Mobile Number
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. USR-002 or 9823456781"
                  value={idOrPhone}
                  onChange={(e) => setIdOrPhone(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password / PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password (e.g. suresh@123 or 1234)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 tap-highlight"
              disabled={isLoading}
            >
              <span>Login to Assigned Route</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick Demo 1-Click Login Section */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 text-center">
              Quick 1-Click Login
            </p>
            <div className="space-y-1.5">
              {deliveryBoys.map((boy) => (
                <button
                  key={boy.user_id}
                  type="button"
                  onClick={() => handleQuickLogin(boy.user_id, boy.password || '1234')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 text-left transition-all tap-highlight flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs group-hover:text-blue-700">
                        {boy.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        ID: {boy.user_id} • Pass: {boy.password || '1234'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    Login
                  </span>
                </button>
              ))}

              {adminUser && (
                <button
                  type="button"
                  onClick={() => handleQuickLogin(adminUser.user_id, adminUser.password || 'admin@123')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200/80 text-left transition-all tap-highlight flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs group-hover:text-purple-700">
                        {adminUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        ID: {adminUser.user_id} • Pass: {adminUser.password || 'admin@123'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    Admin
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feature Hint Footer */}
        <div className="text-center text-xs text-blue-200/70 space-y-1">
          <p className="flex items-center justify-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-Present Enabled: All deliveries are automatically counted.</span>
          </p>
          <p className="text-[11px] text-blue-300/50">
            Delivery boys only need to log in when reporting an Absent house.
          </p>
        </div>
      </div>
    </div>
  );
}
