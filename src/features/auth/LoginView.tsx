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
    <div className="w-screen h-screen min-h-screen bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      {/* ================= LEFT SIDE: LOTUS FLOWER HERO IMAGE (FULL HALF) ================= */}
      <div className="relative lg:col-span-6 xl:col-span-7 hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-slate-950 overflow-hidden h-full">
        {/* Background Image */}
        <img
          src="/login-bg.jpg"
          alt="Lotus Flower"
          className="absolute inset-0 w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-1000 ease-out select-none"
        />
        {/* Subtle gradient overlays for high readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/50" />
        <div className="absolute inset-0 bg-blue-950/15 backdrop-blur-[0.5px]" />

        {/* Top Brand Tag */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/30 bg-slate-900/60 backdrop-blur-md">
            <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
              Lotus Flower ERP
            </h2>
            <p className="text-xs font-bold text-blue-200/90 tracking-wider uppercase">
              Daily Subscriptions & Billing
            </p>
          </div>
        </div>

        {/* Bottom Hero Showcase Text */}
        <div className="relative z-10 space-y-3.5 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md text-pink-100 border border-white/25 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            Automated Pooja Flower ERP
          </span>
          <h1 className="text-3xl xl:text-5xl font-black text-white leading-tight drop-shadow-lg">
            Fresh Daily Deliveries, Zero Hassle Month-End Billing.
          </h1>
          <p className="text-xs xl:text-sm text-slate-200/90 leading-relaxed drop-shadow">
            Auto-present daily drops. Delivery staff only log in to mark absent houses or submit month-end customer payments.
          </p>

          <div className="pt-3 flex items-center gap-6 text-xs text-slate-300 font-medium border-t border-white/15">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Auto-Delivered Daily</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>₹0 On Absent Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: SIGN IN FORM (FULL HALF) ================= */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center px-6 sm:px-12 xl:px-16 py-8 bg-white text-slate-900 h-full overflow-y-auto">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Header / Mobile Brand View */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 lg:hidden">
                  <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200">
                    <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-black text-slate-900 text-lg">Lotus ERP</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 ml-auto">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  Staff Portal
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Sign In
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your credentials to access assigned routes & deliveries
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  User ID or Mobile Number
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. USR-002 or 9823456781"
                    value={idOrPhone}
                    onChange={(e) => setIdOrPhone(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password / PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password (e.g. suresh@123)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3.5 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 tap-highlight"
                disabled={isLoading}
              >
                <span>Login to Assigned Route</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>



            {/* Footer Note */}
            <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Auto-present active: Default delivered every morning</span>
            </div>
          </div>
        </div>
      </div>
  );
}
