import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Truck,
  Users,
  CalendarOff,
  Receipt,
  CreditCard,
  BookOpen,
  MapPin,
  BarChart3,
  History,
  X,
  PhoneCall,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Flower2,
  LogOut
} from 'lucide-react';
import { getTodayDateString } from '@/lib/formatters';

export type NavTab = 
  | 'dashboard'
  | 'deliveries'
  | 'customers'
  | 'absences'
  | 'billing'
  | 'payments'
  | 'ledger'
  | 'staff'
  | 'reports'
  | 'audit';

export interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  count?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}: {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { currentUser, isAdmin, isDeliveryBoy, logout } = useAuth();
  const todayStr = getTodayDateString();

  // Get live stats for badges
  const todayDeliveries = StorageService.getDeliveries(todayStr, isDeliveryBoy ? currentUser.user_id : undefined);
  const pendingCount = todayDeliveries.filter(d => d.status === 'PENDING').length;
  const customersCount = StorageService.getCustomers().filter(c => 
    isDeliveryBoy ? c.assigned_delivery_boy_id === currentUser.user_id : true
  ).length;

  const adminNavSections: NavSection[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard' as NavTab, label: 'Admin Dashboard', icon: LayoutDashboard },
        { 
          id: 'deliveries' as NavTab, 
          label: 'Daily Deliveries', 
          icon: Truck, 
          badge: pendingCount > 0 ? `${pendingCount} Pending` : 'All Done',
          badgeColor: pendingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
        },
        { id: 'customers' as NavTab, label: 'Customer Management', icon: Users, count: `${customersCount}` },
        { id: 'absences' as NavTab, label: 'Absence & Leave', icon: CalendarOff },
      ],
    },
    {
      title: 'BILLING & FINANCIALS',
      items: [
        { id: 'billing' as NavTab, label: 'Monthly Invoicing', icon: Receipt },
        { id: 'payments' as NavTab, label: 'Payments & Receipts', icon: CreditCard },
        { id: 'ledger' as NavTab, label: 'Customer Ledger', icon: BookOpen },
      ],
    },
    {
      title: 'ADMIN & COMPLIANCE',
      items: [
        { id: 'staff' as NavTab, label: 'Delivery Staff', icon: MapPin },
        { id: 'reports' as NavTab, label: 'Reports & Export', icon: BarChart3 },
        { id: 'audit' as NavTab, label: 'Audit Trail', icon: History },
      ],
    },
  ];

  const deliveryBoyNavSections: NavSection[] = [
    {
      title: 'DIRECTORY',
      items: [
        { id: 'customers' as NavTab, label: 'My Assigned Clients', icon: Users, count: `${customersCount}` },
      ],
    },
  ];

  const sections = isAdmin ? adminNavSections : deliveryBoyNavSections;

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out shrink-0',
          'lg:translate-x-0 lg:static lg:z-0 lg:h-full',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer Header (mobile only) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2">
            <Flower2 className="w-5 h-5 text-blue-600" />
            <span className="font-extrabold text-slate-900">Lotus ERP Menu</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-3.5 m-3.5 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                alt={currentUser.name}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-900 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isAdmin ? 'bg-blue-600' : 'bg-emerald-500'
                  )}
                />
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Log Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {isDeliveryBoy && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold">Assigned Route:</span>
                <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                  {currentUser.assigned_area_ids?.[0] === 'AREA-001'
                    ? 'Area A (Civil Lines)'
                    : currentUser.assigned_area_ids?.[0] === 'AREA-002'
                    ? 'Area B (Shanti Nagar)'
                    : 'Area C (Green Ave)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Route Shift:</span>
                </span>
                <span className="font-medium text-slate-700">5:45 AM – 7:30 AM</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-1 space-y-4 overflow-y-auto overscroll-contain">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                {section.title}
              </p>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 select-none tap-highlight group',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase',
                            isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-blue-50 text-blue-700'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.count && (
                        <span
                          className={cn(
                            'text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md',
                            isActive ? 'bg-white/20 text-white' : 'text-slate-400 bg-slate-100'
                          )}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer shop status card */}
        <div className="p-3 m-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span>Lotus Flower Shop</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Online
            </span>
          </div>
          <p className="text-slate-400">Civil Lines • Delhi 110054</p>
        </div>
      </aside>
    </>
  );
}
