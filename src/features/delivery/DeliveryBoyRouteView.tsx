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
  Send
} from 'lucide-react';

export function DeliveryBoyRouteView() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const todayStr = getTodayDateString();

  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
  
  // Note dialog
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DailyDelivery | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadRouteData();
  }, [currentUser]);

  const loadRouteData = () => {
    const custs = StorageService.getCustomers();
    // Delivery boys only see their assigned customers (BRD BR-07)
    const dels = StorageService.getDeliveries(todayStr, currentUser.role === 'DELIVERY_BOY' ? currentUser.user_id : undefined);
    setCustomers(custs);
    setDeliveries(dels);
  };

  const getCustomer = (customerId: string) => {
    return customers.find(c => c.customer_id === customerId);
  };

  const handleUpdateStatus = (delivery: DailyDelivery, status: DeliveryStatus, notes?: string) => {
    StorageService.updateDeliveryStatus(delivery.delivery_id, status, currentUser, notes);
    showToast(
      status === 'DELIVERED' ? 'Marked Delivered' : `Marked as ${status.replace('_', ' ')}`,
      `${getCustomer(delivery.customer_id)?.name || 'Customer'} status recorded`,
      status === 'DELIVERED' ? 'success' : 'info'
    );
    loadRouteData();
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
  const completedStops = deliveries.filter(d => d.status === 'DELIVERED').length;
  const pendingStops = deliveries.filter(d => d.status === 'PENDING').length;
  const onLeaveStops = deliveries.filter(d => d.status === 'VACATION').length;
  const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  // Filtered deliveries
  const displayedDeliveries = deliveries.filter(d => {
    if (filter === 'PENDING') return d.status === 'PENDING';
    if (filter === 'DONE') return d.status !== 'PENDING';
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

            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
              🟢 Route Active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {currentUser.name}
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                {totalStops} Daily Flower Drop-offs Scheduled for Today
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {completedStops}
                <span className="text-lg font-normal text-blue-200">/{totalStops}</span>
              </div>
              <p className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">
                Stops Finished
              </p>
            </div>
          </div>

          {/* Route Progress Bar */}
          <div className="space-y-1.5 mt-4 pt-4 border-t border-white/10">
            <div className="w-full bg-blue-950/50 h-3 rounded-full overflow-hidden p-0.5 backdrop-blur-sm border border-white/10">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-blue-100 font-bold">
              <span>{progressPercent}% Route Complete</span>
              <span>
                {pendingStops} Stops Left • {onLeaveStops} on Vacation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Touch Filter Pills */}
      <div className="flex items-center p-1.5 bg-slate-200/80 backdrop-blur-sm rounded-2xl gap-1">
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all tap-highlight ${
            filter === 'ALL'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Stops ({totalStops})
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all tap-highlight ${
            filter === 'PENDING'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          To Deliver ({pendingStops})
        </button>
        <button
          onClick={() => setFilter('DONE')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all tap-highlight ${
            filter === 'DONE'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({totalStops - pendingStops})
        </button>
      </div>

      {/* Deliveries Card List */}
      <div className="space-y-4">
        {displayedDeliveries.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">All Caught Up!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              No delivery stops remaining under the "{filter.toLowerCase()}" filter.
            </p>
          </div>
        ) : (
          displayedDeliveries.map((delivery, index) => {
            const customer = getCustomer(delivery.customer_id);
            if (!customer) return null;

            const isPending = delivery.status === 'PENDING';
            const isDelivered = delivery.status === 'DELIVERED';
            const isVacation = delivery.status === 'VACATION';

            return (
              <div
                key={delivery.delivery_id}
                className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isPending
                    ? 'border-blue-300 shadow-card ring-1 ring-blue-500/10'
                    : isDelivered
                    ? 'border-emerald-200 bg-emerald-50/15 shadow-2xs'
                    : 'border-slate-200/80 opacity-85'
                }`}
              >
                {/* Stop Top Ribbon */}
                <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">
                        {customer.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">{customer.customer_id}</p>
                    </div>
                  </div>
                  <DeliveryStatusBadge status={delivery.status} />
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
                        <span className="text-[11px] text-slate-500">Morning Drop-off</span>
                      </div>
                    </div>

                    {/* Quick Call Action (Large Touch Target) */}
                    <a
                      href={`tel:${customer.phone}`}
                      className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2.5 rounded-xl text-xs shadow-sm shadow-emerald-500/20 tap-highlight min-h-[42px]"
                    >
                      <Phone className="w-4 h-4" />
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
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {formatCurrency(customer.current_rate)}
                      <span className="text-[10px] font-normal text-slate-500 ml-1">/day</span>
                    </span>
                  </div>

                  {/* Special Gate Instructions Note */}
                  {customer.instructions && (
                    <div className="bg-amber-50/90 border border-amber-200/90 p-3 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-extrabold text-amber-900">Delivery Instructions: </strong>
                        <span>{customer.instructions}</span>
                      </div>
                    </div>
                  )}

                  {/* Vacation Alert Banner if on leave */}
                  {isVacation && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-xs text-blue-900 flex items-center gap-2.5 font-semibold">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Customer is on approved vacation. Do not leave flowers. Non-billable.</span>
                    </div>
                  )}

                  {/* Driver Note Recorded */}
                  {delivery.notes && (
                    <div className="text-xs text-slate-600 italic bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                      Driver Note: "{delivery.notes}"
                    </div>
                  )}

                  {/* Mobile Touch Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(delivery, 'DELIVERED')}
                        className={`col-span-1 min-h-[50px] rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all tap-highlight ${
                          isDelivered
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200/90 active:scale-95'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Delivered</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(delivery, 'CUSTOMER_ABSENT')}
                        className={`col-span-1 min-h-[50px] rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all tap-highlight ${
                          delivery.status === 'CUSTOMER_ABSENT'
                            ? 'bg-slate-800 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 active:scale-95'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Absent</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(delivery, 'NOT_DELIVERED')}
                        className={`col-span-1 min-h-[50px] rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all tap-highlight ${
                          delivery.status === 'NOT_DELIVERED'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                            : 'bg-rose-50 text-rose-800 hover:bg-rose-600 hover:text-white border border-rose-200/90 active:scale-95'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Missed</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <button
                        onClick={() => openNoteDialog(delivery)}
                        className="text-slate-500 hover:text-blue-600 font-bold flex items-center gap-1 tap-highlight py-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span>{delivery.notes ? 'Edit Driver Note' : '+ Add Driver Note'}</span>
                      </button>

                      {!isPending && (
                        <button
                          onClick={() => handleUpdateStatus(delivery, 'PENDING')}
                          className="text-slate-400 hover:text-amber-600 font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

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
