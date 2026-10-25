import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { EmptyState } from '@/components/data-display/EmptyState';
import { formatCurrency, formatDate, formatPhone } from '@/lib/formatters';
import { Customer, LedgerEntry } from '@/types';
import {
  BookOpen,
  Printer,
  Share2,
  Calendar,
  CreditCard,
  Flower2,
  Phone,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';

export function CustomerLedgerView({
  initialCustomerId,
}: {
  initialCustomerId?: string;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    const custs = StorageService.getCustomers();
    setCustomers(custs);
    if (!selectedCustomerId && custs.length > 0) {
      setSelectedCustomerId(custs[0].customer_id);
    }
  }, [initialCustomerId]);

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerLedger(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const loadCustomerLedger = (custId: string) => {
    const entries = StorageService.getLedger(custId);
    // Sort chronological
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setLedgerEntries(entries);
  };

  const currentCustomer = customers.find((c) => c.customer_id === selectedCustomerId);

  const handlePrint = () => {
    window.print();
  };

  const handleShareStatement = () => {
    if (!currentCustomer) return;
    const msg = `📑 *LOTUS FLOWER SHOP - ACCOUNT STATEMENT* 📑\n` +
      `Customer: ${currentCustomer.name}\n` +
      `Address: ${currentCustomer.address}\n` +
      `---------------------------\n` +
      ledgerEntries
        .map(
          (e) =>
            `• ${formatDate(e.date)}: ${e.description}\n` +
            `  Debit: ₹${e.debit || 0} | Credit: ₹${e.credit || 0} | Bal: ₹${e.running_balance}`
        )
        .join('\n') +
      `\n---------------------------\n` +
      `*Current Outstanding Balance: ₹${currentCustomer.current_outstanding}*\n` +
      `Thank you for trusting Lotus Flower Shop! 🙏`;

    window.open(`https://wa.me/91${currentCustomer.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer Account Ledger</h2>
          <p className="text-xs text-slate-500">
            Real-time auditable debit, credit, and running balance ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print Statement</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShareStatement}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            <span>WhatsApp</span>
          </Button>
        </div>
      </div>

      {/* Customer Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <Select
            label="Select Customer Account"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.name} — {c.address}
              </option>
            ))}
          </Select>

          {currentCustomer && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Subscription
                </span>
                <span className="font-bold text-slate-800">{currentCustomer.flower_type}</span>
                <span className="text-slate-500 block">
                  {formatCurrency(currentCustomer.current_rate)} / day
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Current Due
                </span>
                <MoneyDisplay
                  amount={currentCustomer.current_outstanding}
                  highlightNegative
                  size="lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Area - Ledger Table */}
      <div className="printable-area bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        {/* Printable Customer Heading */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">{currentCustomer?.name}</h3>
            <p className="text-xs text-slate-500">{currentCustomer?.address}</p>
            <p className="text-xs text-blue-600 font-semibold">
              {formatPhone(currentCustomer?.phone)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase">Current Balance</span>
            <div className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(currentCustomer?.current_outstanding || 0)}
            </div>
          </div>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No transactions recorded yet for this customer account.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Transaction Details</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Debit (+)</th>
                <th className="py-3 px-4 text-right">Credit (−)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ledgerEntries.map((entry) => (
                <tr key={entry.entry_id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                    {formatDate(entry.date)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      {entry.debit > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      <span>{entry.description}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{entry.reference || '—'}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    {entry.debit > 0 ? (
                      <span className="text-rose-600 font-bold">
                        +{formatCurrency(entry.debit)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    {entry.credit > 0 ? (
                      <span className="text-emerald-600 font-bold">
                        −{formatCurrency(entry.credit)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 bg-slate-50/40">
                    {formatCurrency(entry.running_balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
