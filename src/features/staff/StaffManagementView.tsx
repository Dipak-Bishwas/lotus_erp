import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { useToast } from '@/components/feedback/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { formatPhone } from '@/lib/formatters';
import { generateId } from '@/lib/utils';
import { DeliveryArea, User } from '@/types';
import {
  Users,
  MapPin,
  Plus,
  Phone,
  Truck,
  CheckCircle2,
  FileEdit,
  ShieldCheck,
  Building
} from 'lucide-react';

export function StaffManagementView() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [deliveryBoys, setDeliveryBoys] = useState<User[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);

  // Add staff modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffAreaId, setStaffAreaId] = useState('');

  // Add area modal
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [areaDesc, setAreaDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const boys = StorageService.getDeliveryBoys();
    const ars = StorageService.getAreas();
    setDeliveryBoys(boys);
    setAreas(ars);
    if (!staffAreaId && ars.length > 0) {
      setStaffAreaId(ars[0].area_id);
    }
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffPhone.trim()) {
      showToast('Validation Error', 'Name and phone are required', 'error');
      return;
    }

    const newBoy: User = {
      user_id: generateId('USR'),
      name: staffName.trim(),
      phone: staffPhone.trim(),
      role: 'DELIVERY_BOY',
      status: 'ACTIVE',
      assigned_area_ids: staffAreaId ? [staffAreaId] : [],
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    };

    StorageService.saveUser(newBoy);
    showToast('Staff Added', `Created account for ${newBoy.name}`, 'success');
    setIsStaffModalOpen(false);
    setStaffName('');
    setStaffPhone('');
    loadData();
  };

  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) {
      showToast('Validation Error', 'Area name is required', 'error');
      return;
    }

    const newArea: DeliveryArea = {
      area_id: generateId('AREA'),
      area_name: areaName.trim(),
      description: areaDesc.trim(),
      status: 'ACTIVE',
      customer_count: 0,
    };

    StorageService.saveArea(newArea);
    showToast('Area Created', `Delivery area ${newArea.area_name} added`, 'success');
    setIsAreaModalOpen(false);
    setAreaName('');
    setAreaDesc('');
    loadData();
  };

  const getAreaCustomersCount = (areaId: string) => {
    return StorageService.getCustomers().filter((c) => c.area_id === areaId).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Delivery Staff & Service Areas</h2>
          <p className="text-xs text-slate-500">
            Allocate delivery boys to designated residential delivery zones
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAreaModalOpen(true)}
              className="text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New Area</span>
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsStaffModalOpen(true)}
              className="text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Delivery Boy</span>
            </Button>
          </div>
        )}
      </div>

      {/* Staff Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          <span>Active Delivery Boys ({deliveryBoys.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {deliveryBoys.map((boy) => {
            const assignedArea = areas.find((a) => boy.assigned_area_ids?.includes(a.area_id));
            const assignedCustomers = StorageService.getCustomers().filter(
              (c) => c.assigned_delivery_boy_id === boy.user_id
            );

            return (
              <div
                key={boy.user_id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-subtle space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={boy.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                    alt={boy.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{boy.name}</h4>
                    <a
                      href={`tel:${boy.phone}`}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{formatPhone(boy.phone)}</span>
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Assigned Area:</span>
                    <strong className="text-slate-800">
                      {assignedArea?.area_name || 'All Sectors'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Active Subscriptions:</span>
                    <strong className="text-blue-700 font-mono">
                      {assignedCustomers.length} Homes
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <Badge variant="success" size="sm">
                    {boy.status}
                  </Badge>
                  <span className="text-[11px] text-slate-400">ID: {boy.user_id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Areas Section */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Delivery Areas & Localities ({areas.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {areas.map((area) => {
            const boy = deliveryBoys.find((b) => b.user_id === area.assigned_delivery_boy_id);
            const count = getAreaCustomersCount(area.area_id);

            return (
              <div
                key={area.area_id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-subtle space-y-2"
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{area.area_name}</h4>
                  <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                    {count} Clients
                  </span>
                </div>
                <p className="text-xs text-slate-500">{area.description}</p>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
                  <span>Assigned Staff:</span>
                  <span className="font-semibold text-slate-900">{boy?.name || 'General Route'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Staff Dialog */}
      <Dialog
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title="Add Delivery Boy"
        description="Create account for a new delivery team member"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStaffModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveStaff}>
              Save Staff
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveStaff} className="space-y-3">
          <Input
            label="Full Name"
            placeholder="e.g. Suresh Kumar"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            placeholder="e.g. 9823456781"
            type="tel"
            value={staffPhone}
            onChange={(e) => setStaffPhone(e.target.value)}
            required
          />
          <Select
            label="Primary Assigned Area"
            value={staffAreaId}
            onChange={(e) => setStaffAreaId(e.target.value)}
          >
            {areas.map((a) => (
              <option key={a.area_id} value={a.area_id}>
                {a.area_name}
              </option>
            ))}
          </Select>
        </form>
      </Dialog>

      {/* Add Area Dialog */}
      <Dialog
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        title="Add Delivery Area"
        description="Register a new delivery sector or neighborhood"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAreaModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveArea}>
              Create Area
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveArea} className="space-y-3">
          <Input
            label="Area Name"
            placeholder="e.g. Area D - Preet Vihar & Anand Vihar"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            required
          />
          <Input
            label="Description / Landmarks"
            placeholder="e.g. Sector 1 to 5, Metro station road"
            value={areaDesc}
            onChange={(e) => setAreaDesc(e.target.value)}
          />
        </form>
      </Dialog>
    </div>
  );
}
