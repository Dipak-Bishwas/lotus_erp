import React from 'react';
import { Customer, CustomerRateHistory, DeliveryArea, User } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CustomerStatusBadge } from '@/components/ui/Badge';
import { MoneyDisplay, DateDisplay } from '@/components/data-display/MoneyDisplay';
import { formatCurrency, formatPhone } from '@/lib/formatters';
import { StorageService } from '@/lib/storage';
import {
  Phone,
  MapPin,
  Calendar,
  Flower2,
  FileText,
  UserCheck,
  CreditCard,
  BookOpen,
  CalendarOff,
  History
} from 'lucide-react';

export function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
  onEdit,
  onRecordPayment,
  onRecordAbsence,
  onViewLedger,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit: (c: Customer) => void;
  onRecordPayment: (c: Customer) => void;
  onRecordAbsence: (c: Customer) => void;
  onViewLedger: (c: Customer) => void;
}) {
  if (!customer) return null;

  const area = StorageService.getAreas().find((a) => a.area_id === customer.area_id);
  const deliveryBoy = StorageService.getDeliveryBoys().find(
    (b) => b.user_id === customer.assigned_delivery_boy_id
  );
  const rates = StorageService.getRates().filter((r) => r.customer_id === customer.customer_id);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      description={`Customer ID: ${customer.customer_id}`}
      maxWidth="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClose();
              onViewLedger(customer);
            }}
          >
            <BookOpen className="w-4 h-4 mr-1.5" />
            <span>View Ledger</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
            >
              Edit Profile
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                onClose();
                onRecordPayment(customer);
              }}
            >
              <CreditCard className="w-4 h-4 mr-1.5" />
              <span>Collect Payment</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status & Balance Banner */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CustomerStatusBadge status={customer.status} />
            <span className="text-xs text-slate-500">Since {customer.start_date}</span>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Outstanding Balance</p>
            <MoneyDisplay
              amount={customer.current_outstanding}
              highlightNegative
              size="lg"
            />
          </div>
        </div>

        {/* Contact & Route Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-[10px]">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Mobile Contact</span>
            </div>
            <a
              href={`tel:${customer.phone}`}
              className="text-sm font-bold text-blue-600 hover:underline block"
            >
              {formatPhone(customer.phone)}
            </a>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-[10px]">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Assigned Delivery Staff</span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              {deliveryBoy?.name || 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Delivery Address & Notes */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">{customer.address}</p>
              <p className="text-slate-500 mt-0.5">{area?.area_name}</p>
            </div>
          </div>

          {customer.instructions && (
            <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-amber-900 bg-amber-50/70 p-2 rounded-lg">
              <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Delivery Instructions: </span>
                <span>{customer.instructions}</span>
              </div>
            </div>
          )}
        </div>

        {/* Subscribed Product & Price */}
        <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Flower2 className="w-4 h-4 text-rose-500" />
            <div>
              <p className="font-bold text-slate-900">{customer.flower_type}</p>
              <p className="text-slate-500">Standard Daily Flower</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-extrabold text-blue-700">
              {formatCurrency(customer.current_rate)}
            </span>
            <span className="text-[11px] text-slate-400 block">per day</span>
          </div>
        </div>

        {/* Effective Rate History Table (BR-02 & TDD Page 6) */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Effective Pricing History</span>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2 px-3">Flower Type</th>
                  <th className="py-2 px-3">Daily Rate</th>
                  <th className="py-2 px-3">Effective Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-slate-400 text-center">
                      Current rate active since {customer.start_date}
                    </td>
                  </tr>
                ) : (
                  rates.map((r) => (
                    <tr key={r.rate_id}>
                      <td className="py-2 px-3 font-medium text-slate-800">{r.flower_type}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {formatCurrency(r.daily_price)}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{r.effective_from}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
