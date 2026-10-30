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
import { CustomerAttendanceCalendarModal } from './CustomerAttendanceCalendarModal';
import { MarkAbsentModal } from '@/features/delivery/MarkAbsentModal';
import { DeliveryActionModal } from '@/features/delivery/DeliveryActionModal';
import { generateId } from '@/lib/utils';
import { Payment, PaymentMethod } from '@/types';
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

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [calendarTargetCustomer, setCalendarTargetCustomer] = useState<Customer | null>(null);

  // Absent Modal State (for Admin or direct absent)
  const [absentModalOpen, setAbsentModalOpen] = useState(false);
  const [absentTargetCustomer, setAbsentTargetCustomer] = useState<Customer | null>(null);
  const [absentTargetDelivery, setAbsentTargetDelivery] = useState<DailyDelivery | null>(null);
  const [absentTargetDate, setAbsentTargetDate] = useState<string>(getTodayDateString());

  // Delivery Boy Action Modal State (Payment Receive & Absent popup)
  const [deliveryActionModalOpen, setDeliveryActionModalOpen] = useState(false);
  const [actionTargetCustomer, setActionTargetCustomer] = useState<Customer | null>(null);
  const [actionTargetDelivery, setActionTargetDelivery] = useState<DailyDelivery | null>(null);
  const [actionInitialTab, setActionInitialTab] = useState<'PAYMENT' | 'ABSENT'>('PAYMENT');
  const [actionInitialDate, setActionInitialDate] = useState<string>(getTodayDateString());

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

  const handleOpenDeliveryAction = (
    customer: Customer,
    initialTab: 'PAYMENT' | 'ABSENT' = 'PAYMENT',
    targetDate?: string,
    delivery?: DailyDelivery | null
  ) => {
    const theDate = targetDate || getTodayDateString();
    const del = delivery || StorageService.getDeliveries().find(
      (d) => d.customer_id === customer.customer_id && d.delivery_date === theDate
    );
    setActionTargetCustomer(customer);
    setActionTargetDelivery(del || null);
    setActionInitialTab(initialTab);
    setActionInitialDate(theDate);
    setDeliveryActionModalOpen(true);
  };

  const handleDeliveryActionPayment = (paymentData: {
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    for_billing_month: string;
    reference?: string;
    notes?: string;
  }) => {
    if (!actionTargetCustomer) return;
    const currentMonthCode = paymentData.payment_date.replace('-', '').slice(0, 6);
    const randomReceiptNum = Math.floor(100 + Math.random() * 900);
    const receiptNumber = `REC-${currentMonthCode}-${randomReceiptNum}`;

    const monthNote = `Bill for ${paymentData.for_billing_month}`;
    const combinedNotes = paymentData.notes
      ? `${monthNote} • ${paymentData.notes}`
      : monthNote;

    const newPayment: Payment = {
      payment_id: generateId('PAY'),
      receipt_number: receiptNumber,
      customer_id: actionTargetCustomer.customer_id,
      payment_date: paymentData.payment_date,
      amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      reference: paymentData.reference,
      notes: combinedNotes,
      recorded_by: currentUser.user_id,
      recorded_by_name: currentUser.name,
      status: 'COMPLETED',
    };

    StorageService.recordPayment(newPayment, currentUser);
    showToast(
      'Payment Recorded',
      `₹${paymentData.amount} received for ${paymentData.for_billing_month} from ${actionTargetCustomer.name}`,
      'success'
    );
    loadData();
  };

  const handleDeliveryActionAbsent = (reason: string, date: string, notes?: string) => {
    if (!actionTargetCustomer) return;
    StorageService.recordCustomerDailyAbsence(
      actionTargetCustomer.customer_id,
      date,
      reason,
      notes,
      currentUser
    );
    showToast(
      'Marked Absent',
      `${actionTargetCustomer.name} marked absent for ${date} (₹0 bill)`,
      'info'
    );
    loadData();
  };

  const handleDeliveryActionRevertPresent = () => {
    if (!actionTargetCustomer) return;
    const del = todayDeliveries.find((d) => d.customer_id === actionTargetCustomer.customer_id);
    if (del) {
      StorageService.updateDeliveryStatus(del.delivery_id, 'DELIVERED', currentUser);
      showToast('Reverted to Present', `${actionTargetCustomer.name} marked Delivered`, 'success');
      loadData();
    }
  };

  const handleOpenAbsentModal = (customer: Customer, targetDate?: string, delivery?: DailyDelivery | null) => {
    const theDate = targetDate || getTodayDateString();
    const del = delivery || StorageService.getDeliveries().find(
      (d) => d.customer_id === customer.customer_id && d.delivery_date === theDate
    );
    setAbsentTargetCustomer(customer);
    setAbsentTargetDelivery(del || null);
    setAbsentTargetDate(theDate);
    setAbsentModalOpen(true);
  };

  const handleConfirmAbsent = (reason: string, notes?: string) => {
    if (absentTargetCustomer) {
      StorageService.recordCustomerDailyAbsence(
        absentTargetCustomer.customer_id,
        absentTargetDate,
        reason,
        notes,
        currentUser
      );
      showToast(
        'Marked Absent',
        `${absentTargetCustomer.name} marked absent for ${absentTargetDate} (₹0 bill)`,
        'info'
      );
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

      {/* Customer List Table */}
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
      ) : (
        /* ================= ENTERPRISE TABLE VIEW ================= */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Delivery Area</th>
                <th className="py-3.5 px-4">Flower Variety</th>
                <th className="py-3.5 px-4">Flower Type</th>
                <th className="py-3.5 px-4">Daily Rate</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.map((c) => {
                const isGarland = /mala|garland|veni|string/i.test(c.flower_type);
                const varietyCategory = isGarland ? 'Haar (Garland)' : 'Loose Flower';

                return (
                  <tr
                    key={c.customer_id}
                    onClick={
                      !isAdmin
                        ? () => handleOpenDeliveryAction(c)
                        : undefined
                    }
                    className={`hover:bg-blue-50/40 transition-colors ${
                      !isAdmin ? 'cursor-pointer hover:bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Customer Name */}
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

                    {/* Phone */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <a
                        href={`tel:${c.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{formatPhone(c.phone)}</span>
                      </a>
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-4">
                      <p className="text-[11px] text-slate-700 max-w-[220px] leading-snug">
                        {c.address}
                      </p>
                    </td>

                    {/* Delivery Area */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{getAreaName(c.area_id)}</p>
                      <p className="text-[10px] text-slate-400">
                        Staff: {getDeliveryBoyName(c.assigned_delivery_boy_id)}
                      </p>
                    </td>

                    {/* Flower Variety: Haar (Garland) or Loose Flower */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isGarland
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <Flower2 className="w-3 h-3" />
                        <span>{varietyCategory}</span>
                      </span>
                    </td>

                    {/* Flower Type */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 text-xs block leading-tight">
                        {c.flower_type}
                      </span>
                    </td>

                    {/* Daily Rate */}
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(c.current_rate)}
                      <span className="text-[10px] text-slate-400 font-sans font-medium"> / day</span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <CustomerStatusBadge status={c.status} />
                    </td>

                    {/* Actions: Edit, Pay */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {isAdmin ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCustomer(c);
                                setIsFormOpen(true);
                              }}
                              className="text-xs px-2.5 py-1 text-blue-600 hover:bg-blue-50 border-blue-200 font-bold flex items-center gap-1"
                              title="Edit Customer Profile"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onRecordPayment(c)}
                              className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold flex items-center gap-1"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenDeliveryAction(c)}
                            className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold flex items-center gap-1"
                            title="Collect Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* Attendance & Delivery Calendar Modal */}
      <CustomerAttendanceCalendarModal
        isOpen={!!calendarTargetCustomer}
        onClose={() => setCalendarTargetCustomer(null)}
        customer={calendarTargetCustomer}
        onSelectDateAbsent={(date, delivery) => {
          if (calendarTargetCustomer) {
            handleOpenDeliveryAction(calendarTargetCustomer, 'ABSENT', date, delivery);
          }
        }}
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
        date={absentTargetDate}
        onConfirmAbsent={handleConfirmAbsent}
      />

      {/* Delivery Boy Quick Action Modal (Receive Payment & Mark Absent) */}
      <DeliveryActionModal
        isOpen={deliveryActionModalOpen}
        onClose={() => {
          setDeliveryActionModalOpen(false);
          setActionTargetCustomer(null);
          setActionTargetDelivery(null);
        }}
        customer={actionTargetCustomer}
        delivery={actionTargetDelivery}
        initialTab={actionInitialTab}
        initialDate={actionInitialDate}
        onConfirmAbsent={handleDeliveryActionAbsent}
        onRecordPayment={handleDeliveryActionPayment}
        onRevertPresent={handleDeliveryActionRevertPresent}
      />
    </div>
  );
}
