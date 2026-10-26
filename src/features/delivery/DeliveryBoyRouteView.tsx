import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { useToast } from '@/components/feedback/ToastContext';
import { Button } from '@/components/ui/Button';
import { Badge, DeliveryStatusBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatPhone, getTodayDateString } from '@/lib/formatters';
import { DailyDelivery, Customer, DeliveryStatus } from '@/types';
import { MarkAbsentModal } from './MarkAbsentModal';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Navigation,
  Sparkles,
  Flower2,
  RotateCcw,
  Sun,
  ShieldCheck,
  Search,
  CheckCheck,
  CalendarOff,
  UserX
} from 'lucide-react';

export function DeliveryBoyRouteView() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const todayStr = getTodayDateString();

  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'DELIVERED' | 'ABSENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Mark Absent Modal State
  const [absentModalOpen, setAbsentModalOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState<Customer | null>(null);
  const [targetDelivery, setTargetDelivery] = useState<DailyDelivery | null>(null);

  // Quick top absent picker
  const [quickAbsentCustomerId, setQuickAbsentCustomerId] = useState('');

  // Note dialog
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DailyDelivery | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadRouteData();
  }, [currentUser]);

  const loadRouteData = () => {
    // Delivery boys only see their assigned customers (BRD BR-07)
    const allCustomers = StorageService.getCustomers();
    const assignedCustomers = allCustomers.filter(c => 
      currentUser.role === 'DELIVERY_BOY' ? c.assigned_delivery_boy_id === currentUser.user_id : true
    );
    const dels = StorageService.getDeliveries(todayStr, currentUser.role === 'DELIVERY_BOY' ? currentUser.user_id : undefined);

    setCustomers(assignedCustomers);
    setDeliveries(dels);
  };

  const getCustomer = (customerId: string) => {
    return customers.find(c => c.customer_id === customerId);
  };

  const handleUpdateStatus = (delivery: DailyDelivery, status: DeliveryStatus, notes?: string, absentReason?: string) => {
    StorageService.updateDeliveryStatus(delivery.delivery_id, status, currentUser, notes, absentReason);
    const customer = getCustomer(delivery.customer_id);
    showToast(
      status === 'DELIVERED' ? 'Marked Delivered (Present)' : 'Marked Absent / Skipped',
      `${customer?.name || 'Customer'} marked as ${status === 'DELIVERED' ? 'Present' : 'Absent (₹0)'}`,
      status === 'DELIVERED' ? 'success' : 'info'
    );
    loadRouteData();
  };

  const handleOpenAbsentModal = (delivery: DailyDelivery, customer: Customer) => {
    setTargetDelivery(delivery);
    setTargetCustomer(customer);
    setAbsentModalOpen(true);
  };

  const handleConfirmAbsent = (reason: string, notes?: string) => {
    if (targetDelivery) {
      handleUpdateStatus(targetDelivery, 'CUSTOMER_ABSENT', notes, reason);
    } else if (targetCustomer) {
      StorageService.recordCustomerDailyAbsence(
        targetCustomer.customer_id,
        todayStr,
        reason,
        notes,
        currentUser
      );
      showToast('Absent Recorded', `${targetCustomer.name} marked absent for today`, 'info');
      loadRouteData();
    }
  };

  const handleQuickAbsentFromDropdown = (customerId: string) => {
    if (!customerId) return;
    const cust = getCustomer(customerId);
    const del = deliveries.find(d => d.customer_id === customerId);
    if (cust) {
      setTargetCustomer(cust);
      setTargetDelivery(del || null);
      setAbsentModalOpen(true);
      setQuickAbsentCustomerId('');
    }
  };

  const openNoteDialog = (delivery: DailyDelivery) => {
    setSelectedDelivery(delivery);
    setNoteText(delivery.notes || '');
    setNoteDialogOpen(true);
  };

  const saveNote = () => {
    if (selectedDelivery) {
      StorageService.updateDeliveryStatus(
        selectedDelivery.delivery_id,
        selectedDelivery.status,
        currentUser,
        noteText
      );
      showToast('Note Saved', 'Delivery note recorded', 'success');
      setNoteDialogOpen(false);
      loadRouteData();
    }
  };

  // Metrics
  const totalStops = deliveries.length;
  const deliveredStops = deliveries.filter(d => d.status === 'DELIVERED').length;
  const absentStops = deliveries.filter(d => d.status === 'CUSTOMER_ABSENT' || d.status === 'NOT_DELIVERED').length;
  const vacationStops = deliveries.filter(d => d.status === 'VACATION').length;

  // Filtered deliveries
  const displayedDeliveries = deliveries.filter(d => {
    const cust = getCustomer(d.customer_id);
    if (!cust) return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchAddr = cust.address.toLowerCase().includes(q);
      const matchPhone = cust.phone.includes(q);
      const matchId = cust.customer_id.toLowerCase().includes(q);
      if (!matchName && !matchAddr && !matchPhone && !matchId) return false;
    }

    // Filter tab
    if (filter === 'DELIVERED') return d.status === 'DELIVERED';
    if (filter === 'ABSENT') return d.status === 'CUSTOMER_ABSENT' || d.status === 'NOT_DELIVERED' || d.status === 'VACATION';
    return true;
  });

  return (
    <div className="space-y-4 pb-20 sm:pb-8 max-w-3xl mx-auto">
      {/* Route Header Banner with Sunrise Theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 text-white rounded-3xl p-5 sm:p-6 shadow-float border border-blue-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white">
                <Sun className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                Morning Route
              </span>
              <span className="text-xs text-blue-200 font-medium">{todayStr}</span>
            </div>

            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Auto-Present Enabled
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {currentUser.name}
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                {totalStops} Assigned Customer Drop-offs for Today
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {deliveredStops}
                <span className="text-lg font-normal text-blue-200">/{totalStops}</span>
              </div>
              <p className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">
                Delivered (Present)
              </p>
            </div>
          </div>

          {/* Business Model Clarification Notice */}
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-blue-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-white font-extrabold block">
                Automatic Delivery Attendance (Default Present):
              </strong>
              <span>
                All {totalStops} houses are automatically counted as <strong>Delivered</strong>. 
                You only need to open this app if a customer refused or delivery was missed to record an <strong>Absent with Reason</strong> (₹0 bill).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search & Absent Finder Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search house, name, phone or address to mark absent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70"
            />
          </div>

          {/* Quick select dropdown to jump to absent */}
          <div className="hidden sm:block">
            <select
              value={quickAbsentCustomerId}
              onChange={(e) => handleQuickAbsentFromDropdown(e.target.value)}
              className="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-rose-100 transition-colors"
            >
              <option value="">🚫 Quick Mark Absent...</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.name} ({c.address.slice(0, 20)}...)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Touch Filter Pills */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all tap-highlight ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Stops ({totalStops})
          </button>
          <button
            onClick={() => setFilter('DELIVERED')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all tap-highlight ${
              filter === 'DELIVERED'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delivered ({deliveredStops})
          </button>
          <button
            onClick={() => setFilter('ABSENT')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all tap-highlight ${
              filter === 'ABSENT'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Absent / Missed ({absentStops + vacationStops})
          </button>
        </div>
      </div>

      {/* Deliveries Card List */}
      <div className="space-y-4">
        {displayedDeliveries.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">No Customers Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              No delivery stops matching your current search or filter.
            </p>
          </div>
        ) : (
          displayedDeliveries.map((delivery, index) => {
            const customer = getCustomer(delivery.customer_id);
            if (!customer) return null;

            const isDelivered = delivery.status === 'DELIVERED';
            const isAbsent = delivery.status === 'CUSTOMER_ABSENT' || delivery.status === 'NOT_DELIVERED';
            const isVacation = delivery.status === 'VACATION';

            return (
              <div
                key={delivery.delivery_id}
                className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isAbsent
                    ? 'border-rose-300 bg-rose-50/20 shadow-xs'
                    : isVacation
                    ? 'border-blue-200 bg-blue-50/20 opacity-90'
                    : 'border-slate-200/90 shadow-2xs'
                }`}
              >
                {/* Stop Top Ribbon */}
                <div className={`px-5 py-3.5 flex items-center justify-between border-b ${
                  isAbsent 
                    ? 'border-rose-100 bg-rose-50/60' 
                    : isVacation 
                    ? 'border-blue-100 bg-blue-50/50' 
                    : 'border-slate-100 bg-slate-50/50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shadow-xs ${
                      isAbsent
                        ? 'bg-rose-600 text-white'
                        : isVacation
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">
                        {customer.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">{customer.customer_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDelivered && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Delivered (Present)
                      </span>
                    )}
                    {isAbsent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Absent (₹0 Bill)
                      </span>
                    )}
                    {isVacation && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                        <CalendarOff className="w-3.5 h-3.5 text-blue-600" />
                        Vacation (Leave)
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Details Body */}
                <div className="p-5 space-y-3.5">
                  {/* Address & Quick Call Button */}
                  <div className="flex items-start justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-start gap-2.5 text-slate-700 text-xs">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 text-sm block leading-snug">
                          {customer.address}
                        </span>
                        <span className="text-[11px] text-slate-500">Daily Morning Flower Drop</span>
                      </div>
                    </div>

                    {/* Quick Call Action */}
                    <a
                      href={`tel:${customer.phone}`}
                      className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-sm shadow-emerald-500/20 tap-highlight"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>

                  {/* Flower Item & Rate */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-100 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                        <Flower2 className="w-4 h-4" />
                      </div>
                      <span>{customer.flower_type}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(customer.current_rate)}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">/day</span>
                      </span>
                      <p className="text-[10px] font-bold text-slate-500">
                        {isAbsent || isVacation ? '₹0 Billed Today' : 'Billable Today'}
                      </p>
                    </div>
                  </div>

                  {/* Reason Box if marked Absent */}
                  {isAbsent && (
                    <div className="bg-rose-50 border border-rose-200/90 p-3.5 rounded-2xl text-xs text-rose-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Absent Reason Recorded:</span>
                      </div>
                      <p className="font-bold text-rose-950 pl-5">
                        "{delivery.absent_reason || delivery.notes || 'Marked Absent'}"
                      </p>
                      <p className="text-[11px] text-rose-700 pl-5">
                        This day will NOT be charged to the customer at month-end.
                      </p>
                    </div>
                  )}

                  {/* Vacation Alert Banner if on leave */}
                  {isVacation && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-xs text-blue-900 flex items-center gap-2.5 font-semibold">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Customer is on approved vacation. Do not deliver flowers. ₹0 Billed.</span>
                    </div>
                  )}

                  {/* Delivery Boy Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    {/* Primary Status Switcher */}
                    {isDelivered && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAbsentModal(delivery, customer)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <UserX className="w-4 h-4 text-rose-600" />
                        <span>Mark Absent / Skip Today</span>
                      </Button>
                    )}

                    {isAbsent && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(delivery, 'DELIVERED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 min-h-[44px]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Revert to Delivered (Present)</span>
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleOpenAbsentModal(delivery, customer)}
                          className="text-xs font-bold text-rose-700 hover:text-rose-900 underline px-2 py-1"
                        >
                          Change Reason
                        </button>
                      </div>
                    )}

                    {isVacation && (
                      <span className="text-xs font-semibold text-slate-500 italic">
                        Planned leave approved by admin
                      </span>
                    )}

                    {/* Driver Note button */}
                    <button
                      onClick={() => openNoteDialog(delivery)}
                      className="text-slate-500 hover:text-blue-600 font-bold flex items-center justify-center gap-1 text-xs py-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>{delivery.notes ? 'Edit Note' : '+ Note'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reusable Mark Absent Modal */}
      <MarkAbsentModal
        isOpen={absentModalOpen}
        onClose={() => setAbsentModalOpen(false)}
        customer={targetCustomer}
        delivery={targetDelivery}
        date={todayStr}
        onConfirmAbsent={handleConfirmAbsent}
      />

      {/* Note dialog */}
      <Dialog
        isOpen={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        title="Delivery Stop Note"
        description="Record driver comments or special observations"
        footer={
          <>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveNote}>
              Save Note
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Driver Note / Observation"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Handed to security guard, house locked, dog barking at gate..."
          />
        </div>
      </Dialog>
    </div>
  );
}
