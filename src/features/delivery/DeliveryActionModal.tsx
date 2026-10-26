import React, { useState } from 'react';
import { Customer, DailyDelivery, PaymentMethod } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPhone, getTodayDateString } from '@/lib/formatters';
import {
  CreditCard,
  UserX,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Flower2,
  Calendar,
  IndianRupee,
  Receipt,
  ArrowRight
} from 'lucide-react';

interface DeliveryActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  delivery?: DailyDelivery | null;
  onConfirmAbsent: (reason: string, date: string, notes?: string) => void;
  onRecordPayment: (payment: {
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    for_billing_month: string;
    reference?: string;
    notes?: string;
  }) => void;
  onRevertPresent: () => void;
}

// Helper to generate recent billing months (Previous months + current month)
function getRecentBillingMonths(): { code: string; label: string }[] {
  const months: { code: string; label: string }[] = [];
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Past 6 months
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const code = `${yr}-${mo}`;
    const name = monthNames[d.getMonth()];
    const tag = i === 0 ? '(Current Month)' : i === 1 ? '(Previous Month)' : '';
    months.push({
      code,
      label: `${name} ${yr} ${tag}`.trim(),
    });
  }
  return months;
}

export function DeliveryActionModal({
  isOpen,
  onClose,
  customer,
  delivery,
  onConfirmAbsent,
  onRecordPayment,
  onRevertPresent,
}: DeliveryActionModalProps) {
  const [activeTab, setActiveTab] = useState<'PAYMENT' | 'ABSENT'>('PAYMENT');
  const availableMonths = React.useMemo(() => getRecentBillingMonths(), []);

  // Default billing month: if before 15th of month, default to previous month; else current month
  const defaultMonth = (() => {
    const today = new Date();
    if (today.getDate() <= 15 && availableMonths.length > 1) {
      return availableMonths[1].code; // Previous month
    }
    return availableMonths[0].code;
  })();

  // Payment form state
  const [amount, setAmount] = useState<number | string>(
    customer?.current_outstanding && customer.current_outstanding > 0
      ? customer.current_outstanding
      : 100
  );
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [billingMonth, setBillingMonth] = useState<string>(defaultMonth);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('CASH');
  const [reference, setReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Absent form state (Manual reason & Date selector)
  const [absentDate, setAbsentDate] = useState<string>(getTodayDateString());
  const [manualReason, setManualReason] = useState<string>(delivery?.absent_reason || '');

  // Sync default amount when customer changes
  React.useEffect(() => {
    if (customer) {
      setAmount(
        customer.current_outstanding && customer.current_outstanding > 0
          ? customer.current_outstanding
          : customer.current_rate * 30
      );
      if (delivery?.absent_reason) {
        setManualReason(delivery.absent_reason);
      }
    }
  }, [customer, delivery]);

  if (!customer) return null;

  const isAbsent = delivery?.status === 'CUSTOMER_ABSENT' || delivery?.status === 'NOT_DELIVERED';
  const isDelivered = delivery?.status === 'DELIVERED' || !delivery; // Default auto-present

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (numAmount <= 0) return;

    onRecordPayment({
      amount: numAmount,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      for_billing_month: billingMonth,
      reference: reference.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
    });
    onClose();
  };

  const handleAbsentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReason.trim()) return;

    onConfirmAbsent(manualReason.trim(), absentDate);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      description={`Customer ID: ${customer.customer_id} • Select an action`}
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Customer Quick Header Card */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base">{customer.name}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {customer.customer_id}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-medium">{customer.address}</span>
              </div>
            </div>

            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0 tap-highlight shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Flower2 className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-bold text-slate-800">{customer.flower_type}</span>
              <span className="text-slate-400">({formatCurrency(customer.current_rate)}/day)</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold mr-1">Pending Balance:</span>
              <span className={`font-mono font-black ${customer.current_outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(customer.current_outstanding || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Switcher Tabs (2 Large Action Buttons) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('PAYMENT')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 tap-highlight ${
              activeTab === 'PAYMENT'
                ? 'bg-white text-emerald-700 shadow-sm shadow-emerald-500/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Receive Payment</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ABSENT')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 tap-highlight ${
              activeTab === 'ABSENT'
                ? 'bg-white text-rose-700 shadow-sm shadow-rose-500/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX className="w-4 h-4 text-rose-600" />
            <span>Mark Absent</span>
          </button>
        </div>

        {/* ================= SECTION 1: RECEIVE PAYMENT ================= */}
        {activeTab === 'PAYMENT' && (
          <form onSubmit={handlePaymentSubmit} className="space-y-3.5 animate-in fade-in duration-150">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <span className="font-semibold block">Total Pending Balance:</span>
                <span className="text-[11px] text-emerald-800">Month-end billing / prior dues</span>
              </div>
              <span className="font-mono font-black text-base text-emerald-700">
                {formatCurrency(customer.current_outstanding || 0)}
              </span>
            </div>

            {/* Bill For Which Month */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Paying For Billing Month
              </label>
              <select
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {availableMonths.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Select which month's bill this payment belongs to (e.g., January bill paid in early February).
              </p>
            </div>

            {/* Payment Received Date & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Received Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full text-xs font-bold pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Amount Collected (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-base font-black font-mono pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    placeholder="Enter collected amount"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'UPI', 'BANK_TRANSFER'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all tap-highlight ${
                      paymentMethod === method
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method === 'BANK_TRANSFER' ? 'Bank' : method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  UPI UTR / Reference No. (Optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. 329847120489"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Note / Remarks (Optional)
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g. Received cash from guard"
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-4"
              >
                <Receipt className="w-4 h-4 mr-1.5" />
                <span>Save Payment & Update Outstanding</span>
              </Button>
            </div>
          </form>
        )}

        {/* ================= SECTION 2: MARK ABSENT ================= */}
        {activeTab === 'ABSENT' && (
          <form onSubmit={handleAbsentSubmit} className="space-y-3.5 animate-in fade-in duration-150">
            {isAbsent ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Customer is already marked Absent today:</span>
                </div>
                <p className="font-extrabold pl-5">
                  "{delivery?.absent_reason || 'Absent'}"
                </p>
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-amber-800">Need to change status back to Delivered?</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onRevertPresent();
                      onClose();
                    }}
                    className="bg-white text-emerald-700 border-emerald-300 font-bold text-xs hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Revert to Delivered</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900">
                Marking absent will charge <strong>₹0</strong> for today on month-end bill.
              </div>
            )}

            {/* Absent Date (Today or Past Days) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Absent Date (Today or Past Day) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  max={getTodayDateString()}
                  value={absentDate}
                  onChange={(e) => setAbsentDate(e.target.value)}
                  className="w-full text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                You can mark absent for today or select any missed past day.
              </p>
            </div>

            {/* Manual Reason Typed by Delivery Boy */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Type Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="Type reason here (e.g., Gate was locked, customer refused, out of town, etc.)..."
                className="w-full text-xs font-medium p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none bg-white"
                autoFocus
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                className="font-bold px-4"
                disabled={!manualReason.trim()}
              >
                <UserX className="w-4 h-4 mr-1.5" />
                <span>Confirm Absent (₹0 Bill)</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}
