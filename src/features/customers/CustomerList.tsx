import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { useToast } from '@/components/feedback/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CustomerStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/data-display/EmptyState';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { formatCurrency, formatPhone, getTodayDateString } from '@/lib/formatters';
import { Customer, DeliveryArea, User, DailyDelivery } from '@/types';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { MarkAbsentModal } from '@/features/delivery/MarkAbsentModal';
import {
  Plus,
  Search,
  Users,
  MapPin,
  Phone,
  FileEdit,
  Eye,
  CreditCard,
  CalendarOff,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Flower2,
  Clock,
  Sparkles,
  Navigation,
  FileText,
  X,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  UserX,
  AlertCircle,
  IndianRupee
} from 'lucide-react';

export function CustomerList({
  onRecordPayment,
  onRecordAbsence,
  onViewLedger,
}: {
  onRecordPayment: (cust: Customer) => void;
  onRecordAbsence: (cust: Customer) => void;
  onViewLedger: (cust: Customer) => void;
}) {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<User[]>([]);
  const [todayDeliveries, setTodayDeliveries] = useState<DailyDelivery[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // Absent Modal State
  const [absentModalOpen, setAbsentModalOpen] = useState(false);
  const [absentTargetCustomer, setAbsentTargetCustomer] = useState<Customer | null>(null);
  const [absentTargetDelivery, setAbsentTargetDelivery] = useState<DailyDelivery | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const custs = StorageService.getCustomers();
    const ars = StorageService.getAreas();
    const boys = StorageService.getDeliveryBoys();
    const dels = StorageService.getDeliveries(getTodayDateString());
    setCustomers(custs);
    setAreas(ars);
    setDeliveryBoys(boys);
    setTodayDeliveries(dels);
  };

  const handleOpenAbsentModal = (customer: Customer) => {
    const del = todayDeliveries.find((d) => d.customer_id === customer.customer_id);
    setAbsentTargetCustomer(customer);
    setAbsentTargetDelivery(del || null);
    setAbsentModalOpen(true);
  };

  const handleConfirmAbsent = (reason: string, notes?: string) => {
    if (absentTargetCustomer) {
      StorageService.recordCustomerDailyAbsence(
        absentTargetCustomer.customer_id,
        getTodayDateString(),
        reason,
        notes,
        currentUser
      );
      showToast('Marked Absent', `${absentTargetCustomer.name} marked absent for today (₹0 bill)`, 'info');
      setAbsentModalOpen(false);
      loadData();
    }
  };

  const handleRevertToPresent = (customer: Customer) => {
    const del = todayDeliveries.find((d) => d.customer_id === customer.customer_id);
    if (del) {
      StorageService.updateDeliveryStatus(del.delivery_id, 'DELIVERED', currentUser);
      showToast('Reverted to Present', `${customer.name} marked Delivered`, 'success');
      loadData();
    }
  };

  const handleSaveCustomer = (customer: Customer) => {
    StorageService.saveCustomer(customer, currentUser);
    showToast(
      selectedCustomer ? 'Customer Updated' : 'Customer Created',
      `${customer.name} profile saved`,
      'success'
    );
    loadData();
  };

  const getAreaName = (areaId: string) => {
    return areas.find((a) => a.area_id === areaId)?.area_name || areaId;
  };

  const getDeliveryBoyName = (boyId: string) => {
    return deliveryBoys.find((b) => b.user_id === boyId)?.name || boyId;
  };

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    // Delivery Boy role can only see their assigned customers (BRD BR-07)
    if (currentUser.role === 'DELIVERY_BOY' && c.assigned_delivery_boy_id !== currentUser.user_id) {
      return false;
    }

    if (selectedArea !== 'ALL' && c.area_id !== selectedArea) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.customer_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate metrics
  const totalAssignedCustomers = filteredCustomers.length;
  const activeCount = filteredCustomers.filter((c) => c.status === 'ACTIVE').length;
  const pendingPaymentCustomersCount = filteredCustomers.filter(
    (c) => (c.current_outstanding || 0) > 0
  ).length;
  const totalDailyValue = filteredCustomers
    .filter((c) => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + c.current_rate, 0);
  const totalOutstanding = filteredCustomers.reduce(
    (sum, c) => sum + (c.current_outstanding || 0),
    0
  );

  // Delivery Boy's assigned area name
  const assignedAreaName = (() => {
    if (currentUser.assigned_area_ids && currentUser.assigned_area_ids.length > 0) {
      const matched = areas.find((a) => currentUser.assigned_area_ids?.includes(a.area_id));
      if (matched) return matched.area_name.split('-')[0].trim();
    }
    if (filteredCustomers.length > 0 && filteredCustomers[0].area_id) {
      const matched = areas.find((a) => a.area_id === filteredCustomers[0].area_id);
      if (matched) return matched.area_name.split('-')[0].trim();
    }
    return areas[0]?.area_name.split('-')[0].trim() || 'Assigned Area';
  })();

  return (
    <div className="space-y-5">
      {/* Page Title & Top CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {currentUser.role === 'DELIVERY_BOY'
                ? 'My Assigned Delivery Customers'
                : 'Customer Management'}
            </h2>
            <span className="text-xs font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              {filteredCustomers.length} Listed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser.role === 'DELIVERY_BOY'
              ? 'All daily flowers are auto-marked Delivered. Click "Absent" only if customer cancelled or was missed.'
              : 'Manage customer accounts, daily flower subscriptions, rates, and delivery allocations'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all tap-highlight ${
                viewMode === 'CARDS'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all tap-highlight ${
                viewMode === 'TABLE'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {isAdmin && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setSelectedCustomer(null);
                setIsFormOpen(true);
              }}
              className="shadow-sm font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Customer</span>
            </Button>
          )}
        </div>
      </div>

      {/* Auto-Present Banner for Delivery Boy */}
      {currentUser.role === 'DELIVERY_BOY' && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-extrabold text-emerald-900 block">
              Auto-Present Active (Default Delivered):
            </strong>
            <span className="text-emerald-800">
              All your {filteredCustomers.length} assigned customers are automatically marked <strong>Delivered (Present)</strong> for today. 
              You don't need to open the app every day. Only open and click <strong>"Mark Absent"</strong> if a customer cancelled or was missed.
            </span>
          </div>
        </div>
      )}

      {/* Top Metric Summary Ribbon */}
      <div className={`grid gap-3 ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {/* Card 1: Total Assigned Customers */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {isAdmin ? 'Active / Total Clients' : 'Total Assigned Clients'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {isAdmin ? (
                <>
                  {activeCount}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ {totalAssignedCustomers}</span>
                </>
              ) : (
                <>
                  {totalAssignedCustomers}
                  <span className="text-xs font-bold text-emerald-600 ml-1.5 text-[11px]">
                    ({activeCount} Active)
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Pending Payment Customers (for Delivery Boy) or Daily Subscription Value (for Admin) */}
        {!isAdmin ? (
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Pending Payment Clients
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5 flex items-baseline gap-1.5">
                <span>{pendingPaymentCustomersCount}</span>
                <span className="text-xs font-normal text-slate-400">
                  {pendingPaymentCustomersCount === 1 ? 'customer' : 'customers'}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Daily Subscription Value
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-0.5">
                {formatCurrency(totalDailyValue)}
                <span className="text-[10px] font-normal text-slate-400 ml-1">/ day</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Flower2 className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Admin only: Monthly Forecast */}
        {isAdmin && (
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Monthly Forecast
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                {formatCurrency(totalDailyValue * 30)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Card: Assigned Area (for Delivery Boy) or Total Outstanding (for Admin) */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {isAdmin ? 'Total Outstanding' : 'Assigned Area'}
            </span>
            {isAdmin ? (
              <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-0.5">
                {formatCurrency(totalOutstanding)}
              </div>
            ) : (
              <div className="text-base sm:text-lg font-black text-blue-700 truncate max-w-[140px] mt-0.5" title={assignedAreaName}>
                {assignedAreaName}
              </div>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            {isAdmin ? <ShieldCheck className="w-5 h-5 text-rose-600" /> : <MapPin className="w-5 h-5 text-blue-600" />}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Input
              placeholder="Search by customer name, phone, address, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              rightIcon={
                searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 hover:text-slate-600 tap-highlight"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs min-w-[130px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Customer List / Cards */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description="Try adjusting your search criteria or add a new customer."
          actionLabel={isAdmin ? 'Add New Customer' : undefined}
          onAction={() => {
            setSelectedCustomer(null);
            setIsFormOpen(true);
          }}
        />
      ) : viewMode === 'CARDS' ? (
        /* ================= CARDS GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => {
            const todayDelivery = todayDeliveries.find((d) => d.customer_id === c.customer_id);
            const isAbsentToday = todayDelivery?.status === 'CUSTOMER_ABSENT' || todayDelivery?.status === 'NOT_DELIVERED';
            const isVacationToday = todayDelivery?.status === 'VACATION';

            return (
              <div
                key={c.customer_id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-card transition-all duration-200 flex flex-col justify-between group space-y-4 ${
                  isAbsentToday
                    ? 'border-rose-300 bg-rose-50/20'
                    : isVacationToday
                    ? 'border-blue-200 bg-blue-50/20'
                    : 'border-slate-200/90 hover:border-blue-400'
                }`}
              >
                {/* Top Row: Avatar, Name & Status */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-50 border border-blue-200/60 flex items-center justify-center text-blue-700 font-black text-base shadow-xs group-hover:scale-105 transition-transform">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                          {c.name}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400">{c.customer_id}</p>
                      </div>
                    </div>
                    <CustomerStatusBadge status={c.status} />
                  </div>

                  {/* Subscribed Product & Price Pill */}
                  <div className="p-3 bg-gradient-to-r from-blue-50/60 to-slate-50 rounded-xl border border-blue-100/80 flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <Flower2 className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">
                          {c.flower_type}
                        </span>
                        <span className="text-[10px] text-slate-500">Pooja Flower Subscription</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-blue-700 font-mono text-sm block">
                        {formatCurrency(c.current_rate)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">/ day</span>
                    </div>
                  </div>

                  {/* Address & Contact Details */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="font-medium text-slate-700 leading-snug">{c.address}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-slate-900">{formatPhone(c.phone)}</span>
                      </div>

                      <a
                        href={`tel:${c.phone}`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1 tap-highlight"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>

                  {/* Gate / Delivery Instructions Note */}
                  {c.instructions && (
                    <div className="mt-3 p-2.5 bg-amber-50/90 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Gate Note: </strong>
                        <span>{c.instructions}</span>
                      </div>
                    </div>
                  )}

                  {/* Delivery Boy Today's Delivery Attendance Status */}
                  {currentUser.role === 'DELIVERY_BOY' && (
                    <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      isAbsentToday
                        ? 'bg-rose-50 border-rose-200 text-rose-950 font-bold'
                        : isVacationToday
                        ? 'bg-blue-50 border-blue-200 text-blue-950 font-bold'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-bold'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {isAbsentToday ? (
                          <>
                            <UserX className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Absent: {todayDelivery?.absent_reason || 'Marked Absent'}</span>
                          </>
                        ) : isVacationToday ? (
                          <>
                            <CalendarOff className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>On Leave / Vacation</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Delivered (Present)</span>
                          </>
                        )}
                      </div>
                      <span className="font-mono text-[11px] font-black">
                        {isAbsentToday || isVacationToday ? '₹0 Today' : formatCurrency(c.current_rate)}
                      </span>
                    </div>
                  )}
                </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {isAdmin ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Balance Due
                    </span>
                    <MoneyDisplay
                      amount={c.current_outstanding}
                      highlightNegative
                      size="sm"
                    />
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Route: {getAreaName(c.area_id)}
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  {currentUser.role === 'DELIVERY_BOY' && (
                    <>
                      {isAbsentToday ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevertToPresent(c)}
                          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 h-8 font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Revert Present</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAbsentModal(c)}
                          className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 h-8 font-bold"
                        >
                          <UserX className="w-3.5 h-3.5 mr-1" />
                          <span>Mark Absent</span>
                        </Button>
                      )}
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDetailCustomer(c)}
                    className="text-xs h-8 px-2.5"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    <span>Details</span>
                  </Button>

                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsFormOpen(true);
                        }}
                        className="text-xs text-blue-600 h-8 px-2"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onRecordPayment(c)}
                        className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 h-8 px-2.5"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" />
                        <span>Pay</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        /* ================= ENTERPRISE TABLE VIEW ================= */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">Client Profile</th>
                <th className="py-3.5 px-4">Phone & Address</th>
                <th className="py-3.5 px-4">Delivery Area</th>
                <th className="py-3.5 px-4">Flower Variety</th>
                <th className="py-3.5 px-4">Daily Rate</th>
                {isAdmin && <th className="py-3.5 px-4">Outstanding</th>}
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.map((c) => (
                <tr key={c.customer_id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.customer_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <a
                      href={`tel:${c.phone}`}
                      className="font-bold text-blue-600 hover:underline block"
                    >
                      {formatPhone(c.phone)}
                    </a>
                    <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {c.address}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-800">{getAreaName(c.area_id)}</p>
                    <p className="text-[11px] text-slate-400">
                      Staff: {getDeliveryBoyName(c.assigned_delivery_boy_id)}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">{c.flower_type}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatCurrency(c.current_rate)}
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4">
                      <MoneyDisplay
                        amount={c.current_outstanding}
                        highlightNegative
                        size="sm"
                      />
                    </td>
                  )}
                  <td className="py-3.5 px-4">
                    <CustomerStatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetailCustomer(c)}
                        className="p-1.5 text-slate-500 hover:text-blue-600"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600"
                            title="Edit Profile"
                          >
                            <FileEdit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onRecordPayment(c)}
                            className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold"
                            title="Record Payment"
                          >
                            Pay
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
        areas={areas}
        deliveryBoys={deliveryBoys}
      />

      <CustomerDetailModal
        isOpen={!!detailCustomer}
        onClose={() => setDetailCustomer(null)}
        customer={detailCustomer}
        onEdit={(cust) => {
          setSelectedCustomer(cust);
          setIsFormOpen(true);
        }}
        onRecordPayment={onRecordPayment}
        onRecordAbsence={onRecordAbsence}
        onViewLedger={onViewLedger}
      />

      {/* Mark Absent Modal */}
      <MarkAbsentModal
        isOpen={absentModalOpen}
        onClose={() => setAbsentModalOpen(false)}
        customer={absentTargetCustomer}
        delivery={absentTargetDelivery}
        date={getTodayDateString()}
        onConfirmAbsent={handleConfirmAbsent}
      />
    </div>
  );
}
