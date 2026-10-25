import React, { useState, useEffect } from 'react';
import { Customer, DeliveryArea, User } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { generateId } from '@/lib/utils';
import { getTodayDateString } from '@/lib/formatters';

export function CustomerFormModal({
  isOpen,
  onClose,
  customer,
  onSave,
  areas,
  deliveryBoys,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSave: (cust: Customer) => void;
  areas: DeliveryArea[];
  deliveryBoys: User[];
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [areaId, setAreaId] = useState('');
  const [assignedBoyId, setAssignedBoyId] = useState('');
  const [flowerType, setFlowerType] = useState('Fresh Marigold Mala (Orange)');
  const [rate, setRate] = useState<number>(10);
  const [instructions, setInstructions] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [status, setStatus] = useState<Customer['status']>('ACTIVE');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setAddress(customer.address);
      setAreaId(customer.area_id);
      setAssignedBoyId(customer.assigned_delivery_boy_id);
      setFlowerType(customer.flower_type);
      setRate(customer.current_rate);
      setInstructions(customer.instructions || '');
      setStartDate(customer.start_date);
      setStatus(customer.status);
      setOpeningBalance(customer.opening_balance || 0);
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setAreaId(areas[0]?.area_id || '');
      setAssignedBoyId(deliveryBoys[0]?.user_id || '');
      setFlowerType('Fresh Marigold Mala (Orange)');
      setRate(10);
      setInstructions('');
      setStartDate(getTodayDateString());
      setStatus('ACTIVE');
      setOpeningBalance(0);
    }
    setError('');
  }, [customer, isOpen, areas, deliveryBoys]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!address.trim()) {
      setError('Delivery address is required');
      return;
    }
    if (rate <= 0) {
      setError('Daily rate must be greater than ₹0');
      return;
    }

    const newCustomer: Customer = {
      customer_id: customer ? customer.customer_id : generateId('CUST'),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      area_id: areaId || areas[0]?.area_id || '',
      assigned_delivery_boy_id: assignedBoyId || deliveryBoys[0]?.user_id || '',
      flower_type: flowerType.trim(),
      current_rate: Number(rate),
      instructions: instructions.trim(),
      start_date: startDate,
      status,
      opening_balance: Number(openingBalance),
      current_outstanding: customer ? customer.current_outstanding : Number(openingBalance),
    };

    onSave(newCustomer);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer Profile' : 'Add New Customer'}
      description="Register daily flower subscription & delivery details"
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            {customer ? 'Update Customer' : 'Create Customer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Customer Name"
            placeholder="e.g. Rajesh Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Mobile Number (10 Digits)"
            placeholder="e.g. 9811223344"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <Input
          label="Full Delivery Address"
          placeholder="e.g. Flat 402, Lotus Tower, Civil Lines"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Delivery Area"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            required
          >
            {areas.map((a) => (
              <option key={a.area_id} value={a.area_id}>
                {a.area_name}
              </option>
            ))}
          </Select>

          <Select
            label="Assigned Delivery Staff"
            value={assignedBoyId}
            onChange={(e) => setAssignedBoyId(e.target.value)}
            required
          >
            {deliveryBoys.map((b) => (
              <option key={b.user_id} value={b.user_id}>
                {b.name} ({b.phone})
              </option>
            ))}
          </Select>
        </div>

        {/* Flower Type & Pricing */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <Input
            label="Flower Variety / Puja Product"
            placeholder="e.g. Fresh Marigold Mala, Lotus Bloom Pair"
            value={flowerType}
            onChange={(e) => setFlowerType(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Daily Price (Per Delivery)
            </label>
            <div className="flex items-center gap-2 mb-2">
              {[5, 10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRate(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all tap-highlight ${
                    rate === preset
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min="1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              placeholder="Or enter custom daily rate"
              required
            />
          </div>
        </div>

        <Input
          label="Delivery Instructions (Door, Timing, Gate)"
          placeholder="e.g. Hang on front door hook before 6:30 AM"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Service Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <Select
            label="Subscription Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Customer['status'])}
          >
            <option value="ACTIVE">Active (Delivering)</option>
            <option value="PAUSED">Paused (Temporary Hold)</option>
            <option value="INACTIVE">Inactive (Discontinued)</option>
          </Select>

          {!customer && (
            <Input
              label="Opening Carry Balance"
              type="number"
              min="0"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              placeholder="₹0"
            />
          )}
        </div>
      </form>
    </Dialog>
  );
}
