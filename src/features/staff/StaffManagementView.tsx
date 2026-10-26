import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { useToast } from '@/components/feedback/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { formatPhone, getTodayDateString } from '@/lib/formatters';
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
  Building,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Calendar,
  Lock,
  Copy,
  Check,
  Power,
  AlertTriangle
} from 'lucide-react';

export function StaffManagementView() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [deliveryBoys, setDeliveryBoys] = useState<User[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add / Edit Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffAreaId, setStaffAreaId] = useState('');
  const [staffStatus, setStaffStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [joiningDate, setJoiningDate] = useState(getTodayDateString());
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [error, setError] = useState('');

  // Password visibility state for each card
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);

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

  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    const newId = generateId('USR');
    setStaffId(newId);
    setStaffName('');
    setStaffPhone('');
    setStaffPassword('lotus@123');
    setStaffAreaId(areas[0]?.area_id || '');
    setStaffStatus('ACTIVE');
    setJoiningDate(getTodayDateString());
    setShowModalPassword(false);
    setError('');
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (boy: User) => {
    setEditingStaffId(boy.user_id);
    setStaffId(boy.user_id);
    setStaffName(boy.name);
    setStaffPhone(boy.phone);
    setStaffPassword(boy.password || 'lotus@123');
    setStaffAreaId(boy.assigned_area_ids?.[0] || (areas[0]?.area_id || ''));
    setStaffStatus(boy.status);
    setJoiningDate(boy.joining_date || getTodayDateString());
    setShowModalPassword(false);
    setError('');
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId.trim()) {
      setError('Staff ID is required');
      return;
    }
    if (!staffName.trim()) {
      setError('Staff name is required');
      return;
    }
    if (!staffPhone.trim()) {
      setError('Mobile phone number is required');
      return;
    }
    if (!staffPassword.trim()) {
      setError('Login password is required');
      return;
    }

    // Check collision for new IDs
    if (!editingStaffId) {
      const exists = StorageService.getUsers().some(
        (u) => u.user_id.toLowerCase() === staffId.trim().toLowerCase()
      );
      if (exists) {
        setError(`Staff ID "${staffId}" already exists. Please choose a unique ID.`);
        return;
      }
    }

    const updatedUser: User = {
      user_id: staffId.trim(),
      name: staffName.trim(),
      phone: staffPhone.trim(),
      password: staffPassword.trim(),
      role: 'DELIVERY_BOY',
      status: staffStatus,
      joining_date: joiningDate,
      assigned_area_ids: staffAreaId ? [staffAreaId] : [],
      avatar_url:
        deliveryBoys.find((b) => b.user_id === staffId)?.avatar_url ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    };

    StorageService.saveUser(updatedUser, currentUser);
    showToast(
      editingStaffId ? 'Staff Updated' : 'Delivery Boy Added',
      `${updatedUser.name} credentials & status saved successfully`,
      'success'
    );
    setIsStaffModalOpen(false);
    loadData();
  };

  const handleToggleStatus = (boy: User) => {
    const isActivating = boy.status !== 'ACTIVE';
    const actionWord = isActivating ? 'activate' : 'deactivate';

    if (
      window.confirm(
        `Are you sure you want to ${actionWord} ${boy.name}?\n${
          !isActivating
            ? 'They will be suspended from making deliveries until re-activated.'
            : 'They will be authorized to access assigned deliveries and routes.'
        }`
      )
    ) {
      const newStatus: User['status'] = isActivating ? 'ACTIVE' : 'INACTIVE';
      const updated: User = { ...boy, status: newStatus };
      StorageService.saveUser(updated, currentUser);
      showToast(
        isActivating ? 'Delivery Boy Activated' : 'Delivery Boy Deactivated',
        `${boy.name} status is now ${newStatus}`,
        isActivating ? 'success' : 'info'
      );
      loadData();
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const copyCredentials = (boy: User) => {
    const text = `Lotus ERP Staff Login:\nID: ${boy.user_id}\nPassword: ${boy.password || 'lotus@123'}\nPhone: ${boy.phone}\nStatus: ${boy.status}`;
    navigator.clipboard.writeText(text);
    setCopiedStaffId(boy.user_id);
    showToast('Copied', `Login credentials for ${boy.name} copied to clipboard`, 'info');
    setTimeout(() => setCopiedStaffId(null), 3000);
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

  // Filter delivery boys by active/inactive
  const filteredBoys = deliveryBoys.filter((boy) => {
    if (statusFilter === 'ACTIVE') return boy.status === 'ACTIVE';
    if (statusFilter === 'INACTIVE') return boy.status === 'INACTIVE';
    return true;
  });

  const activeBoysCount = deliveryBoys.filter((b) => b.status === 'ACTIVE').length;
  const inactiveBoysCount = deliveryBoys.filter((b) => b.status === 'INACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Delivery Staff
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin can activate/deactivate delivery boys, manage login IDs & passwords, and assign residential routes
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
              onClick={handleOpenAddStaff}
              className="text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Delivery Boy</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filter Pills for Status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all tap-highlight ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Staff ({deliveryBoys.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all tap-highlight ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🟢 Active ({activeBoysCount})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all tap-highlight ${
              statusFilter === 'INACTIVE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔴 Inactive ({inactiveBoysCount})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Tip: Tap <strong>"Active" / "Deactivate"</strong> on any card to toggle duty status
        </span>
      </div>

      {/* Staff Grid Cards */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoys.map((boy) => {
            const assignedArea = areas.find((a) => boy.assigned_area_ids?.includes(a.area_id));
            const assignedCustomers = StorageService.getCustomers().filter(
              (c) => c.assigned_delivery_boy_id === boy.user_id
            );
            const isPasswordVisible = visiblePasswords[boy.user_id];
            const isCopied = copiedStaffId === boy.user_id;
            const boyPassword = boy.password || `${boy.user_id.toLowerCase()}@123`;
            const isActive = boy.status === 'ACTIVE';

            return (
              <div
                key={boy.user_id}
                className={`bg-white rounded-3xl border p-5 shadow-xs transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isActive
                    ? 'border-slate-200/90 hover:border-blue-300 hover:shadow-card'
                    : 'border-rose-200 bg-rose-50/15 opacity-80'
                }`}
              >
                {/* Header: Photo, Name, ID & Active/Inactive Toggle Button */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={
                            boy.avatar_url ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
                          }
                          alt={boy.name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                          {boy.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                            ID: {boy.user_id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Active / Inactive Badge + 1-Click Action */}
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => isAdmin && handleToggleStatus(boy)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold transition-all tap-highlight ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                        }`}
                        title={isActive ? 'Click to Deactivate delivery boy' : 'Click to Activate delivery boy'}
                      >
                        <Power className={`w-3 h-3 ${isActive ? 'text-emerald-600' : 'text-rose-600'}`} />
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Warning banner if inactive */}
                  {!isActive && (
                    <div className="mb-3 p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Staff is Deactivated (Off Duty)</span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleToggleStatus(boy)}
                          className="font-bold underline text-rose-700 hover:text-rose-900 tap-highlight ml-1"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  )}

                  {/* Credentials & Assigned Area Box */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2.5 text-xs">
                    {/* Area Assignment */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Assigned Area:</span>
                      </span>
                      <strong className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-bold">
                        {assignedArea?.area_name || 'Unassigned / Float'}
                      </strong>
                    </div>

                    {/* Subscribed Clients Count */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Active Subscriptions:</span>
                      </span>
                      <strong className="text-slate-900 font-mono font-bold">
                        {assignedCustomers.length} Homes
                      </strong>
                    </div>

                    {/* Login Password (with reveal toggle) */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Login Password:</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {isPasswordVisible ? boyPassword : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(boy.user_id)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded tap-highlight"
                          title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                        >
                          {isPasswordVisible ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="flex items-center justify-between text-xs pt-3 px-1">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mobile:</span>
                    </span>
                    <a
                      href={`tel:${boy.phone}`}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      {formatPhone(boy.phone)}
                    </a>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => copyCredentials(boy)}
                    className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-bold p-1 rounded tap-highlight"
                    title="Copy ID & Password to share with delivery boy"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Login</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleStatus(boy)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold border flex items-center gap-1 tap-highlight text-xs ${
                          isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                        }`}
                        title={isActive ? 'Deactivate staff account' : 'Activate staff account'}
                      >
                        <Power className="w-3 h-3" />
                        <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    )}

                    <a
                      href={`tel:${boy.phone}`}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold border border-slate-200 flex items-center gap-1 tap-highlight"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>

                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEditStaff(boy)}
                        className="text-xs text-blue-600 h-8 px-2.5 font-bold"
                      >
                        <FileEdit className="w-3.5 h-3.5 mr-1" />
                        <span>Edit</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Areas Section */}
      <div className="space-y-3 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
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
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between items-center">
                  <span>Assigned Staff:</span>
                  <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border">
                    {boy?.name || 'General Route'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Delivery Boy Dialog */}
      <Dialog
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title={editingStaffId ? 'Edit Delivery Boy' : 'Add New Delivery Boy'}
        description="Configure staff profile, login ID, password, area, and active duty status"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStaffModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveStaff}>
              {editingStaffId ? 'Save Changes' : 'Create Delivery Boy'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
              {error}
            </div>
          )}

          {/* Staff ID & Auto Generate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Staff Login ID / Username *
              </label>
              {!editingStaffId && (
                <button
                  type="button"
                  onClick={() => setStaffId(generateId('USR'))}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Generate Auto ID
                </button>
              )}
            </div>
            <Input
              placeholder="e.g. USR-005 or suresh_db"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              disabled={!!editingStaffId}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              placeholder="e.g. Suresh Kumar"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              required
            />
            <Input
              label="Mobile Number"
              placeholder="e.g. 9823456781"
              type="tel"
              value={staffPhone}
              onChange={(e) => setStaffPhone(e.target.value)}
              required
            />
          </div>

          {/* Password with Reveal & Quick Presets */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Login Password *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStaffPassword('pass@123')}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  Set "pass@123"
                </button>
                <button
                  type="button"
                  onClick={() => setShowModalPassword(!showModalPassword)}
                  className="text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1"
                >
                  {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showModalPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            <Input
              type={showModalPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              required
            />
          </div>

          {/* Area Assignment */}
          <Select
            label="Assign Delivery Area"
            value={staffAreaId}
            onChange={(e) => setStaffAreaId(e.target.value)}
          >
            <option value="">None / Floating Delivery Boy</option>
            {areas.map((a) => (
              <option key={a.area_id} value={a.area_id}>
                {a.area_name}
              </option>
            ))}
          </Select>

          {/* Account Status Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Account Duty Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStaffStatus('ACTIVE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all tap-highlight flex items-center justify-center gap-1.5 ${
                  staffStatus === 'ACTIVE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span>Active (On Duty)</span>
              </button>
              <button
                type="button"
                onClick={() => setStaffStatus('INACTIVE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all tap-highlight flex items-center justify-center gap-1.5 ${
                  staffStatus === 'INACTIVE'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-300" />
                <span>Inactive (Suspended)</span>
              </button>
            </div>
          </div>

          <Input
            label="Joining Date"
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
          />
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
