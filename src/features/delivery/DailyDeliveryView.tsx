import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { useToast } from '@/components/feedback/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DeliveryStatusBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/data-display/EmptyState';
import { formatCurrency, formatDate, getTodayDateString } from '@/lib/formatters';
import { DailyDelivery, Customer, DeliveryStatus, DeliveryArea, User } from '@/types';
import {
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  RotateCcw,
  CheckCheck,
  FileEdit,
  ArrowUpDown
} from 'lucide-react';

export function DailyDeliveryView() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedBoy, setSelectedBoy] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<User[]>([]);

  // Edit dialog
  const [editDelivery, setEditDelivery] = useState<DailyDelivery | null>(null);
  const [editStatus, setEditStatus] = useState<DeliveryStatus>('DELIVERED');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = () => {
    const custs = StorageService.getCustomers();
    const dels = StorageService.getDeliveries(selectedDate);
    const ars = StorageService.getAreas();
    const boys = StorageService.getDeliveryBoys();

    setCustomers(custs);
    setDeliveries(dels);
    setAreas(ars);
    setDeliveryBoys(boys);
  };

  const getCustomer = (customerId: string) => {
    return customers.find((c) => c.customer_id === customerId);
  };

  const getDeliveryBoyName = (boyId: string) => {
    return deliveryBoys.find((b) => b.user_id === boyId)?.name || boyId;
  };

  const getAreaName = (areaId: string) => {
    return areas.find((a) => a.area_id === areaId)?.area_name || areaId;
  };

  const handleOpenEdit = (del: DailyDelivery) => {
    setEditDelivery(del);
    setEditStatus(del.status);
    setEditNotes(del.notes || '');
    setIsDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editDelivery) {
      StorageService.updateDeliveryStatus(
        editDelivery.delivery_id,
        editStatus,
        currentUser,
        editNotes
      );
      showToast('Delivery Updated', 'Record and billable status refreshed', 'success');
      setIsDialogOpen(false);
      loadData();
    }
  };

  // Quick 1-click single update
  const handleQuickStatus = (del: DailyDelivery, status: DeliveryStatus) => {
    StorageService.updateDeliveryStatus(del.delivery_id, status, currentUser);
    showToast('Updated', `Marked as ${status}`, 'info');
    loadData();
  };

  // Bulk action: Mark all remaining pending as Delivered
  const handleBulkMarkDelivered = () => {
    const pendingItems = deliveries.filter((d) => d.status === 'PENDING');
    if (pendingItems.length === 0) return;

    if (window.confirm(`Mark all ${pendingItems.length} pending deliveries for ${selectedDate} as Delivered?`)) {
      pendingItems.forEach((item) => {
        StorageService.updateDeliveryStatus(item.delivery_id, 'DELIVERED', currentUser);
      });
      showToast('Bulk Updated', `Marked ${pendingItems.length} records as Delivered`, 'success');
      loadData();
    }
  };

  // Filtered deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    const cust = getCustomer(d.customer_id);
    if (!cust) return false;

    if (selectedArea !== 'ALL' && cust.area_id !== selectedArea) return false;
    if (selectedBoy !== 'ALL' && d.delivery_boy_id !== selectedBoy) return false;
    if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;
    return true;
  });

  // Summary counts
  const countDelivered = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const countPending = deliveries.filter((d) => d.status === 'PENDING').length;
  const countAbsent = deliveries.filter((d) => d.status === 'CUSTOMER_ABSENT').length;
  const countVacation = deliveries.filter((d) => d.status === 'VACATION').length;
  const countNotDelivered = deliveries.filter((d) => d.status === 'NOT_DELIVERED').length;

  return (
    <div className="space-y-4">
      {/* Top Controls & Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daily Delivery Operations</h2>
            <p className="text-xs text-slate-500">Track and manage date-wise flower deliveries</p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto text-xs font-bold"
            />
            {countPending > 0 && isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkDelivered}
                className="text-xs whitespace-nowrap bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark All</span> Delivered
              </Button>
            )}
          </div>
        </div>

        {/* Filter selects */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          <Select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="text-xs"
          >
            <option value="ALL">All Delivery Areas</option>
            {areas.map((a) => (
              <option key={a.area_id} value={a.area_id}>
                {a.area_name}
              </option>
            ))}
          </Select>

          <Select
            value={selectedBoy}
            onChange={(e) => setSelectedBoy(e.target.value)}
            className="text-xs"
          >
            <option value="ALL">All Delivery Boys</option>
            {deliveryBoys.map((b) => (
              <option key={b.user_id} value={b.user_id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs"
          >
            <option value="ALL">All Delivery Statuses</option>
            <option value="DELIVERED">Delivered (Billable)</option>
            <option value="PENDING">Pending Confirmation</option>
            <option value="VACATION">Vacation / Leave (Non-billable)</option>
            <option value="CUSTOMER_ABSENT">Customer Absent (Non-billable)</option>
            <option value="NOT_DELIVERED">Not Delivered / Missed</option>
          </Select>
        </div>
      </div>

      {/* Date Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <span className="text-slate-500 font-medium">Delivered</span>
          <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            {countDelivered}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <span className="text-slate-500 font-medium">Pending</span>
          <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
            {countPending}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <span className="text-slate-500 font-medium">Vacation</span>
          <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
            {countVacation}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <span className="text-slate-500 font-medium">Absent</span>
          <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {countAbsent}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <span className="text-slate-500 font-medium">Missed</span>
          <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
            {countNotDelivered}
          </span>
        </div>
      </div>

      {/* Responsive Deliveries Container */}
      {filteredDeliveries.length === 0 ? (
        <EmptyState
          title="No Delivery Records Found"
          description={`No customer deliveries found for ${formatDate(selectedDate)} matching the selected filters.`}
        />
      ) : (
        <>
          {/* Mobile Card View (<640px) */}
          <div className="sm:hidden space-y-3">
            {filteredDeliveries.map((del) => {
              const cust = getCustomer(del.customer_id);
              if (!cust) return null;
              return (
                <div
                  key={del.delivery_id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{cust.name}</h4>
                      <p className="text-xs text-slate-500">{cust.address}</p>
                    </div>
                    <DeliveryStatusBadge status={del.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 border-y border-slate-100 text-slate-600">
                    <span>
                      Staff: <strong>{getDeliveryBoyName(del.delivery_boy_id)}</strong>
                    </span>
                    <span>
                      Rate:{' '}
                      <strong className="text-slate-900">{formatCurrency(cust.current_rate)}</strong>
                    </span>
                  </div>

                  {del.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                      Note: {del.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleQuickStatus(del, 'DELIVERED')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-bold tap-highlight ${
                          del.status === 'DELIVERED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() => handleQuickStatus(del, 'CUSTOMER_ABSENT')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-bold tap-highlight ${
                          del.status === 'CUSTOMER_ABSENT'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Absent
                      </button>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(del)}
                      className="text-xs text-blue-600"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>
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
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Area & Address</th>
                  <th className="py-3 px-4">Assigned Boy</th>
                  <th className="py-3 px-4">Flower Item</th>
                  <th className="py-3 px-4">Daily Rate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDeliveries.map((del) => {
                  const cust = getCustomer(del.customer_id);
                  if (!cust) return null;
                  return (
                    <tr key={del.delivery_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{cust.name}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{getAreaName(cust.area_id)}</p>
                        <p className="text-[11px] text-slate-400">{cust.address}</p>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {getDeliveryBoyName(del.delivery_boy_id)}
                      </td>
                      <td className="py-3 px-4">{cust.flower_type}</td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        {formatCurrency(cust.current_rate)}
                      </td>
                      <td className="py-3 px-4">
                        <DeliveryStatusBadge status={del.status} />
                        {del.notes && (
                          <span
                            className="block text-[10px] text-slate-400 italic truncate max-w-[150px]"
                            title={del.notes}
                          >
                            {del.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickStatus(del, 'DELIVERED')}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            title="Mark Delivered"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleQuickStatus(del, 'CUSTOMER_ABSENT')}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                            title="Mark Customer Absent"
                          >
                            Absent
                          </button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(del)}
                            className="p-1 text-slate-500 hover:text-blue-600"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Edit Delivery Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Update Delivery Record"
        description="Edit delivery confirmation and billable status"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        {editDelivery && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="font-bold text-slate-900">
                {getCustomer(editDelivery.customer_id)?.name}
              </p>
            </div>

            <Select
              label="Delivery Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as DeliveryStatus)}
            >
              <option value="DELIVERED">Delivered (Billable)</option>
              <option value="PENDING">Pending (Do not charge until resolved)</option>
              <option value="VACATION">Vacation / Leave (Non-billable)</option>
              <option value="CUSTOMER_ABSENT">Customer Absent (Non-billable)</option>
              <option value="NOT_DELIVERED">Not Delivered / Missed (Non-billable)</option>
            </Select>

            <Input
              label="Notes / Exception Reason"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="e.g. Delivered to guard, house locked, etc."
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
