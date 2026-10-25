import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { useToast } from '@/components/feedback/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/data-display/EmptyState';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { formatCurrency, formatDate, getTodayDateString } from '@/lib/formatters';
import { generateId } from '@/lib/utils';
import { Payment, Customer, PaymentMethod } from '@/types';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import {
  CreditCard,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Banknote,
  Building2
} from 'lucide-react';

export function PaymentManagementView({
  initialCustomerId,
}: {
  initialCustomerId?: string;
}) {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  // Record payment form
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Reversal dialog
  const [isReverseOpen, setIsReverseOpen] = useState(false);
  const [reversePaymentId, setReversePaymentId] = useState<string>('');
  const [reversalReason, setReversalReason] = useState('');

  useEffect(() => {
    loadData();
    if (initialCustomerId) {
      setCustomerId(initialCustomerId);
      const cust = StorageService.getCustomer(initialCustomerId);
      if (cust) {
        setAmount(cust.current_outstanding);
      }
      setIsRecordOpen(true);
    }
  }, [initialCustomerId]);

  const loadData = () => {
    const pays = StorageService.getPayments();
    const custs = StorageService.getCustomers();
    setPayments(pays);
    setCustomers(custs);
    if (!customerId && custs.length > 0) {
      setCustomerId(custs[0].customer_id);
      setAmount(custs[0].current_outstanding);
    }
  };

  const getCustomer = (id: string) => {
    return customers.find((c) => c.customer_id === id);
  };

  const handleOpenRecord = (cust?: Customer) => {
    const targetCust = cust || customers[0];
    if (targetCust) {
      setCustomerId(targetCust.customer_id);
      setAmount(targetCust.current_outstanding || 100);
    }
    setPaymentMethod('UPI');
    setReference('');
    setPaymentDate(getTodayDateString());
    setNotes('');
    setError('');
    setIsRecordOpen(true);
  };

  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    const c = getCustomer(newCustId);
    if (c) {
      setAmount(c.current_outstanding);
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Select a customer');
      return;
    }
    if (amount <= 0) {
      setError('Payment amount must be greater than ₹0');
      return;
    }

    const currentMonthCode = paymentDate.replace('-', '').slice(0, 6);
    const randomReceiptNum = Math.floor(100 + Math.random() * 900);
    const receiptNumber = `REC-${currentMonthCode}-${randomReceiptNum}`;

    const newPayment: Payment = {
      payment_id: generateId('PAY'),
      receipt_number: receiptNumber,
      customer_id: customerId,
      payment_date: paymentDate,
      amount: Number(amount),
      payment_method: paymentMethod,
      reference: reference.trim(),
      notes: notes.trim(),
      recorded_by: currentUser.user_id,
      recorded_by_name: currentUser.name,
      status: 'COMPLETED',
    };

    StorageService.recordPayment(newPayment, currentUser);
    showToast(
      'Payment Recorded',
      `₹${amount} recorded for ${getCustomer(customerId)?.name} (Receipt: ${receiptNumber})`,
      'success'
    );

    setIsRecordOpen(false);
    loadData();
    setSelectedReceiptPayment(newPayment);
  };

  const handleOpenReverse = (paymentId: string) => {
    setReversePaymentId(paymentId);
    setReversalReason('');
    setIsReverseOpen(true);
  };

  const handleConfirmReversal = () => {
    if (!reversalReason.trim()) {
      showToast('Error', 'Please enter a reversal reason for audit log', 'error');
      return;
    }

    const res = StorageService.reversePayment(reversePaymentId, reversalReason.trim(), currentUser);
    if (res.success) {
      showToast('Payment Reversed', 'Financial records and customer ledger updated', 'info');
      setIsReverseOpen(false);
      loadData();
    } else {
      showToast('Error', res.message || 'Failed to reverse payment', 'error');
    }
  };

  // Metrics
  const totalCollections = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const upiCollections = payments
    .filter((p) => p.status === 'COMPLETED' && p.payment_method === 'UPI')
    .reduce((sum, p) => sum + p.amount, 0);

  const cashCollections = payments
    .filter((p) => p.status === 'COMPLETED' && p.payment_method === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Payment Collection & Receipts</h2>
          <p className="text-xs text-slate-500">
            Record customer UPI and cash payments with instant receipts and audit history
          </p>
        </div>

        {isAdmin && (
          <Button size="sm" variant="primary" onClick={() => handleOpenRecord()} className="font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Record Payment</span>
          </Button>
        )}
      </div>

      {/* Collection Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Collected</p>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
              {formatCurrency(totalCollections)}
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">UPI Collections</p>
            <div className="text-2xl font-black text-blue-600 font-mono mt-0.5">
              {formatCurrency(upiCollections)}
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Cash In Hand</p>
            <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">
              {formatCurrency(cashCollections)}
            </div>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
            <Banknote className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Payment History List */}
      {payments.length === 0 ? (
        <EmptyState
          title="No Payments Recorded"
          description="Record your first customer payment using the button above."
          actionLabel="Record Payment"
          onAction={() => handleOpenRecord()}
        />
      ) : (
        <>
          {/* Mobile Cards (<640px) */}
          <div className="sm:hidden space-y-3">
            {payments.map((p) => {
              const cust = getCustomer(p.customer_id);
              const isReversed = p.status === 'REVERSED';
              return (
                <div
                  key={p.payment_id}
                  className={`bg-white rounded-2xl border p-4 shadow-subtle space-y-3 ${
                    isReversed ? 'border-rose-200/60 bg-rose-50/20 opacity-70' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {cust?.name || p.customer_id}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">{p.receipt_number}</p>
                    </div>
                    <div className="text-right">
                      <MoneyDisplay
                        amount={p.amount}
                        size="md"
                        className={isReversed ? 'line-through text-slate-400' : 'text-emerald-700'}
                      />
                      <Badge variant={isReversed ? 'danger' : 'success'} size="sm">
                        {p.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 border-y border-slate-100 text-slate-600">
                    <span>
                      Mode: <strong>{p.payment_method}</strong>
                    </span>
                    <span>Date: {formatDate(p.payment_date)}</span>
                  </div>

                  {p.reference && (
                    <p className="text-xs text-slate-500 font-mono">Ref: {p.reference}</p>
                  )}

                  {isReversed && p.reversal_reason && (
                    <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg font-medium">
                      Reversal Reason: {p.reversal_reason}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedReceiptPayment(p)}
                      className="text-xs"
                    >
                      <Receipt className="w-3.5 h-3.5 mr-1" />
                      <span>Receipt</span>
                    </Button>

                    {!isReversed && isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenReverse(p.payment_id)}
                        className="text-xs text-rose-600 hover:bg-rose-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        <span>Reverse</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>=640px) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.map((p) => {
                  const cust = getCustomer(p.customer_id);
                  const isReversed = p.status === 'REVERSED';
                  return (
                    <tr
                      key={p.payment_id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isReversed ? 'bg-rose-50/20 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.receipt_number}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {cust?.name || p.customer_id}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(p.payment_date)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.reference || '—'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className={isReversed ? 'line-through text-slate-400' : 'text-emerald-700'}>
                          {formatCurrency(p.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isReversed ? 'danger' : 'success'} size="sm">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedReceiptPayment(p)}
                            className="p-1.5 text-xs"
                            title="View Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 mr-1" />
                            <span>Receipt</span>
                          </Button>
                          {!isReversed && isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenReverse(p.payment_id)}
                              className="p-1.5 text-xs text-rose-600 hover:bg-rose-50"
                              title="Reverse Payment"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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
        </>
      )}

      {/* Record Payment Dialog */}
      <Dialog
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Customer Payment"
        description="Allocate payment to account balance & issue receipt"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRecordOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSavePayment}>
              Save & Generate Receipt
            </Button>
          </>
        }
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
              {error}
            </div>
          )}

          <Select
            label="Customer"
            value={customerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            required
          >
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.name} (Due: ₹{c.current_outstanding})
              </option>
            ))}
          </Select>

          {/* Quick preset amount buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Payment Amount (₹)
              </label>
              {getCustomer(customerId) && (
                <span className="text-xs text-slate-500">
                  Current Due: <strong>₹{getCustomer(customerId)?.current_outstanding}</strong>
                </span>
              )}
            </div>

            {getCustomer(customerId)?.current_outstanding ? (
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setAmount(getCustomer(customerId)!.current_outstanding)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                >
                  Pay Full (₹{getCustomer(customerId)!.current_outstanding})
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(200)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  ₹200
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(500)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  ₹500
                </button>
              </div>
            ) : null}

            <Input
              type="number"
              min="1"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="e.g. 200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="UPI">UPI / Google Pay / PhonePe</option>
              <option value="CASH">Cash Collection</option>
              <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
              <option value="OTHER">Other</option>
            </Select>

            <Input
              label="Payment Date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Transaction Reference / UPI ID"
            placeholder="e.g. UPI/981122/GPay48921 or Cash receipt"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />

          <Input
            label="Collector Notes"
            placeholder="e.g. Handed to Suresh Kumar at 6:40 AM"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </form>
      </Dialog>

      {/* Payment Reversal Dialog */}
      <Dialog
        isOpen={isReverseOpen}
        onClose={() => setIsReverseOpen(false)}
        title="Reverse Payment Transaction"
        description="Reversing this payment will restore the customer outstanding balance and append an audit reversal entry."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsReverseOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReversal}>
              Confirm Reversal
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Mandatory Audit Reason for Reversal"
            placeholder="e.g. UPI bounced, entered wrong customer by mistake, duplicate payment"
            value={reversalReason}
            onChange={(e) => setReversalReason(e.target.value)}
            required
          />
        </div>
      </Dialog>

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={!!selectedReceiptPayment}
        onClose={() => setSelectedReceiptPayment(null)}
        payment={selectedReceiptPayment}
      />
    </div>
  );
}
