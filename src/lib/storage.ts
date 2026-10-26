import { 
  Customer, 
  DeliveryArea, 
  DailyDelivery, 
  Absence, 
  Invoice, 
  Payment, 
  LedgerEntry, 
  AuditLog, 
  User, 
  DeliveryStatus,
  CustomerRateHistory
} from '../types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_AREAS, 
  INITIAL_USERS, 
  INITIAL_DELIVERIES, 
  INITIAL_ABSENCES, 
  INITIAL_INVOICES, 
  INITIAL_PAYMENTS, 
  INITIAL_LEDGERS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_RATES
} from './seedData';
import { generateId } from './utils';
import { getTodayDateString } from './formatters';

const STORAGE_KEYS = {
  USERS: 'lotus_erp_users',
  AREAS: 'lotus_erp_areas',
  CUSTOMERS: 'lotus_erp_customers',
  RATES: 'lotus_erp_rates',
  DELIVERIES: 'lotus_erp_deliveries',
  ABSENCES: 'lotus_erp_absences',
  INVOICES: 'lotus_erp_invoices',
  PAYMENTS: 'lotus_erp_payments',
  LEDGERS: 'lotus_erp_ledgers',
  AUDIT: 'lotus_erp_audit',
};

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error setting key ${key}:`, e);
  }
}

export const StorageService = {
  // Initialization & reset
  init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      this.resetAll();
    }
  },

  resetAll(): void {
    setStoredItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStoredItem(STORAGE_KEYS.AREAS, INITIAL_AREAS);
    setStoredItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setStoredItem(STORAGE_KEYS.RATES, INITIAL_RATES);
    setStoredItem(STORAGE_KEYS.DELIVERIES, INITIAL_DELIVERIES);
    setStoredItem(STORAGE_KEYS.ABSENCES, INITIAL_ABSENCES);
    setStoredItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    setStoredItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    setStoredItem(STORAGE_KEYS.LEDGERS, INITIAL_LEDGERS);
    setStoredItem(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  },

  // Users
  getUsers(): User[] {
    return getStoredItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getDeliveryBoys(): User[] {
    return this.getUsers().filter(u => u.role === 'DELIVERY_BOY');
  },

  saveUser(user: User, actor?: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.user_id === user.user_id);
    const isNew = index < 0;
    if (isNew) {
      users.push(user);
    } else {
      users[index] = user;
    }
    setStoredItem(STORAGE_KEYS.USERS, users);

    // If an area is assigned to this user, update that area's assigned_delivery_boy_id
    if (user.assigned_area_ids && user.assigned_area_ids.length > 0) {
      const areas = this.getAreas();
      user.assigned_area_ids.forEach(areaId => {
        const aIdx = areas.findIndex(a => a.area_id === areaId);
        if (aIdx >= 0) {
          areas[aIdx].assigned_delivery_boy_id = user.user_id;
        }
      });
      setStoredItem(STORAGE_KEYS.AREAS, areas);
    }

    if (actor) {
      this.logAudit({
        user_id: actor.user_id,
        user_name: actor.name,
        action: isNew ? 'CREATE_DELIVERY_STAFF' : 'UPDATE_DELIVERY_STAFF',
        entity_type: 'CUSTOMER',
        entity_id: user.user_id,
        change_summary: `${isNew ? 'Created' : 'Updated'} delivery staff ${user.name} (ID: ${user.user_id}, Area: ${user.assigned_area_ids?.join(', ') || 'None'})`,
      });
    }
  },

  // Areas
  getAreas(): DeliveryArea[] {
    return getStoredItem<DeliveryArea[]>(STORAGE_KEYS.AREAS, INITIAL_AREAS);
  },

  saveArea(area: DeliveryArea): void {
    const areas = this.getAreas();
    const idx = areas.findIndex(a => a.area_id === area.area_id);
    if (idx >= 0) {
      areas[idx] = area;
    } else {
      areas.push(area);
    }
    setStoredItem(STORAGE_KEYS.AREAS, areas);
  },

  // Customers
  getCustomers(): Customer[] {
    return getStoredItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  getCustomer(customerId: string): Customer | undefined {
    return this.getCustomers().find(c => c.customer_id === customerId);
  },

  saveCustomer(customer: Customer, user: User): void {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(c => c.customer_id === customer.customer_id);
    const isNew = existingIndex < 0;

    if (isNew) {
      customers.push(customer);
      // Create initial rate record
      this.saveRate({
        rate_id: generateId('RATE'),
        customer_id: customer.customer_id,
        flower_type: customer.flower_type,
        daily_price: customer.current_rate,
        effective_from: customer.start_date,
      });

      // If initial opening balance exists, add ledger entry
      if (customer.opening_balance > 0) {
        this.addLedgerEntry({
          entry_id: generateId('LED'),
          customer_id: customer.customer_id,
          date: customer.start_date,
          description: 'Initial Opening Balance',
          debit: customer.opening_balance,
          credit: 0,
          running_balance: customer.opening_balance,
          type: 'OPENING_BALANCE',
        });
      }

      this.logAudit({
        user_id: user.user_id,
        user_name: user.name,
        action: 'CREATE_CUSTOMER',
        entity_type: 'CUSTOMER',
        entity_id: customer.customer_id,
        change_summary: `Created customer ${customer.name} (Rate: ₹${customer.current_rate}/day, Area: ${customer.area_id})`,
      });
    } else {
      const oldCustomer = customers[existingIndex];
      // Check if price changed -> create new effective rate record
      if (oldCustomer.current_rate !== customer.current_rate) {
        const todayStr = getTodayDateString();
        this.saveRate({
          rate_id: generateId('RATE'),
          customer_id: customer.customer_id,
          flower_type: customer.flower_type,
          daily_price: customer.current_rate,
          effective_from: todayStr,
        });
      }
      customers[existingIndex] = customer;
      this.logAudit({
        user_id: user.user_id,
        user_name: user.name,
        action: 'UPDATE_CUSTOMER',
        entity_type: 'CUSTOMER',
        entity_id: customer.customer_id,
        change_summary: `Updated customer details for ${customer.name}`,
      });
    }

    setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
  },

  // Rates
  getRates(): CustomerRateHistory[] {
    return getStoredItem<CustomerRateHistory[]>(STORAGE_KEYS.RATES, INITIAL_RATES);
  },

  saveRate(rate: CustomerRateHistory): void {
    const rates = this.getRates();
    rates.push(rate);
    setStoredItem(STORAGE_KEYS.RATES, rates);
  },

  // Deliveries
  getDeliveries(date?: string, deliveryBoyId?: string): DailyDelivery[] {
    let deliveries = getStoredItem<DailyDelivery[]>(STORAGE_KEYS.DELIVERIES, INITIAL_DELIVERIES);
    
    // Auto-generate missing today deliveries for active customers
    const targetDate = date || getTodayDateString();
    const existingDateDeliveries = deliveries.filter(d => d.delivery_date === targetDate);
    const customers = this.getCustomers().filter(c => c.status === 'ACTIVE');
    
    let added = false;
    customers.forEach(cust => {
      const exists = existingDateDeliveries.some(d => d.customer_id === cust.customer_id);
      if (!exists) {
        // Check if customer is on approved vacation/absence on this targetDate
        const isAbsent = this.isCustomerAbsentOnDate(cust.customer_id, targetDate);

        deliveries.push({
          delivery_id: generateId('DEL'),
          customer_id: cust.customer_id,
          delivery_date: targetDate,
          delivery_boy_id: cust.assigned_delivery_boy_id,
          status: isAbsent ? 'VACATION' : 'PENDING',
          billable_amount: 0,
          updated_by: 'SYSTEM',
          updated_at: new Date().toISOString(),
          notes: isAbsent ? 'Customer on planned vacation/leave' : '',
        });
        added = true;
      }
    });

    if (added) {
      setStoredItem(STORAGE_KEYS.DELIVERIES, deliveries);
    }

    if (date) {
      deliveries = deliveries.filter(d => d.delivery_date === date);
    }
    if (deliveryBoyId) {
      deliveries = deliveries.filter(d => d.delivery_boy_id === deliveryBoyId);
    }
    return deliveries;
  },

  updateDeliveryStatus(
    deliveryId: string, 
    status: DeliveryStatus, 
    user: User, 
    notes?: string
  ): void {
    const deliveries = getStoredItem<DailyDelivery[]>(STORAGE_KEYS.DELIVERIES, INITIAL_DELIVERIES);
    const idx = deliveries.findIndex(d => d.delivery_id === deliveryId);
    if (idx >= 0) {
      const item = deliveries[idx];
      const customer = this.getCustomer(item.customer_id);
      const rate = customer ? customer.current_rate : 10;
      
      const billable = status === 'DELIVERED' ? rate : 0;
      
      deliveries[idx] = {
        ...item,
        status,
        billable_amount: billable,
        notes: notes !== undefined ? notes : item.notes,
        updated_by: user.user_id,
        updated_at: new Date().toISOString(),
      };
      setStoredItem(STORAGE_KEYS.DELIVERIES, deliveries);

      this.logAudit({
        user_id: user.user_id,
        user_name: user.name,
        action: 'UPDATE_DELIVERY_STATUS',
        entity_type: 'DELIVERY',
        entity_id: deliveryId,
        change_summary: `Marked delivery for ${customer?.name || item.customer_id} as ${status} (Billable: ₹${billable})`,
      });
    }
  },

  // Absences
  getAbsences(): Absence[] {
    return getStoredItem<Absence[]>(STORAGE_KEYS.ABSENCES, INITIAL_ABSENCES);
  },

  isCustomerAbsentOnDate(customerId: string, dateStr: string): boolean {
    const absences = this.getAbsences().filter(
      a => a.customer_id === customerId && a.status === 'APPROVED'
    );
    const checkDate = new Date(dateStr).getTime();
    return absences.some(a => {
      const start = new Date(a.start_date).getTime();
      const end = new Date(a.end_date).getTime();
      return checkDate >= start && checkDate <= end;
    });
  },

  saveAbsence(absence: Absence, user: User): { success: boolean; message?: string } {
    const absences = this.getAbsences();
    
    // Check overlap with existing approved absences for this customer (BRD BR-05)
    const newStart = new Date(absence.start_date).getTime();
    const newEnd = new Date(absence.end_date).getTime();
    
    if (newStart > newEnd) {
      return { success: false, message: 'End date cannot be earlier than start date.' };
    }

    const hasOverlap = absences.some(existing => {
      if (existing.customer_id !== absence.customer_id || existing.status === 'CANCELLED') return false;
      if (existing.absence_id === absence.absence_id) return false;
      const exStart = new Date(existing.start_date).getTime();
      const exEnd = new Date(existing.end_date).getTime();
      return (newStart <= exEnd && newEnd >= exStart);
    });

    if (hasOverlap) {
      return { 
        success: false, 
        message: 'An approved leave already exists covering these dates. Overlapping leave is not allowed.' 
      };
    }

    const idx = absences.findIndex(a => a.absence_id === absence.absence_id);
    if (idx >= 0) {
      absences[idx] = absence;
    } else {
      absences.push(absence);
    }
    setStoredItem(STORAGE_KEYS.ABSENCES, absences);

    // Update any existing deliveries in this range to VACATION
    const deliveries = getStoredItem<DailyDelivery[]>(STORAGE_KEYS.DELIVERIES, INITIAL_DELIVERIES);
    let updatedDeliveriesCount = 0;
    deliveries.forEach(del => {
      if (del.customer_id === absence.customer_id) {
        const delDate = new Date(del.delivery_date).getTime();
        if (delDate >= newStart && delDate <= newEnd) {
          del.status = 'VACATION';
          del.billable_amount = 0;
          del.notes = `Planned leave: ${absence.reason}`;
          updatedDeliveriesCount++;
        }
      }
    });
    if (updatedDeliveriesCount > 0) {
      setStoredItem(STORAGE_KEYS.DELIVERIES, deliveries);
    }

    const customer = this.getCustomer(absence.customer_id);
    this.logAudit({
      user_id: user.user_id,
      user_name: user.name,
      action: 'RECORD_ABSENCE',
      entity_type: 'ABSENCE',
      entity_id: absence.absence_id,
      change_summary: `Recorded ${absence.total_days}-day leave for ${customer?.name} (${absence.start_date} to ${absence.end_date}): ${absence.reason}`,
    });

    return { success: true };
  },

  cancelAbsence(absenceId: string, user: User): void {
    const absences = this.getAbsences();
    const idx = absences.findIndex(a => a.absence_id === absenceId);
    if (idx >= 0) {
      absences[idx].status = 'CANCELLED';
      setStoredItem(STORAGE_KEYS.ABSENCES, absences);

      this.logAudit({
        user_id: user.user_id,
        user_name: user.name,
        action: 'CANCEL_ABSENCE',
        entity_type: 'ABSENCE',
        entity_id: absenceId,
        change_summary: `Cancelled leave record ${absenceId}`,
      });
    }
  },

  // Invoices & Billing
  getInvoices(): Invoice[] {
    return getStoredItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  },

  finalizeInvoice(invoice: Invoice, user: User): void {
    const invoices = this.getInvoices();
    const existingIndex = invoices.findIndex(i => i.invoice_id === invoice.invoice_id);
    
    const finalizedInvoice: Invoice = {
      ...invoice,
      status: 'FINALIZED',
      finalized_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      invoices[existingIndex] = finalizedInvoice;
    } else {
      invoices.push(finalizedInvoice);
    }
    setStoredItem(STORAGE_KEYS.INVOICES, invoices);

    // Update customer outstanding and add ledger entry
    const customer = this.getCustomer(invoice.customer_id);
    if (customer) {
      const customers = this.getCustomers();
      const cIdx = customers.findIndex(c => c.customer_id === customer.customer_id);
      if (cIdx >= 0) {
        customers[cIdx].current_outstanding = invoice.closing_balance;
        setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
      }

      // Add to ledger
      this.addLedgerEntry({
        entry_id: generateId('LED'),
        customer_id: invoice.customer_id,
        date: invoice.created_at.split('T')[0],
        description: `Monthly Flower Bill (${invoice.billing_month}) - ${invoice.billable_days} deliveries`,
        reference: invoice.invoice_number,
        debit: invoice.current_charges,
        credit: 0,
        running_balance: invoice.total_payable,
        type: 'INVOICE',
      });
    }

    this.logAudit({
      user_id: user.user_id,
      user_name: user.name,
      action: 'FINALIZE_INVOICE',
      entity_type: 'INVOICE',
      entity_id: invoice.invoice_id,
      change_summary: `Finalized invoice ${invoice.invoice_number} for customer ${customer?.name}: Total ₹${invoice.total_payable} (${invoice.billable_days} days @ ₹${invoice.daily_rate})`,
    });
  },

  // Payments
  getPayments(): Payment[] {
    return getStoredItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },

  recordPayment(payment: Payment, user: User): void {
    const payments = this.getPayments();
    payments.push(payment);
    setStoredItem(STORAGE_KEYS.PAYMENTS, payments);

    // Update customer outstanding balance
    const customers = this.getCustomers();
    const cIdx = customers.findIndex(c => c.customer_id === payment.customer_id);
    let newBalance = 0;
    if (cIdx >= 0) {
      customers[cIdx].current_outstanding = Math.max(0, customers[cIdx].current_outstanding - payment.amount);
      newBalance = customers[cIdx].current_outstanding;
      setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
    }

    // Ledger entry
    this.addLedgerEntry({
      entry_id: generateId('LED'),
      customer_id: payment.customer_id,
      date: payment.payment_date,
      description: `${payment.payment_method} Payment received (${payment.receipt_number})`,
      reference: payment.reference || payment.receipt_number,
      debit: 0,
      credit: payment.amount,
      running_balance: newBalance,
      type: 'PAYMENT',
    });

    // Check if customer has an invoice to mark partially paid or paid
    const invoices = this.getInvoices();
    const customerInvoices = invoices.filter(
      i => i.customer_id === payment.customer_id && (i.status === 'FINALIZED' || i.status === 'PARTIALLY_PAID')
    );
    if (customerInvoices.length > 0) {
      // Allocate to first pending invoice
      const targetInv = customerInvoices[0];
      const remainingForInv = targetInv.total_payable - targetInv.amount_paid;
      const allocation = Math.min(payment.amount, remainingForInv);
      targetInv.amount_paid += allocation;
      targetInv.closing_balance = targetInv.total_payable - targetInv.amount_paid;
      if (targetInv.closing_balance <= 0) {
        targetInv.status = 'PAID';
      } else {
        targetInv.status = 'PARTIALLY_PAID';
      }
      setStoredItem(STORAGE_KEYS.INVOICES, invoices);
    }

    const customer = this.getCustomer(payment.customer_id);
    this.logAudit({
      user_id: user.user_id,
      user_name: user.name,
      action: 'RECORD_PAYMENT',
      entity_type: 'PAYMENT',
      entity_id: payment.payment_id,
      change_summary: `Recorded ${payment.payment_method} payment of ₹${payment.amount} from ${customer?.name} (Receipt: ${payment.receipt_number})`,
    });
  },

  reversePayment(paymentId: string, reason: string, user: User): { success: boolean; message?: string } {
    const payments = this.getPayments();
    const idx = payments.findIndex(p => p.payment_id === paymentId);
    if (idx < 0) return { success: false, message: 'Payment record not found' };

    const payment = payments[idx];
    if (payment.status === 'REVERSED') {
      return { success: false, message: 'Payment is already reversed' };
    }

    payment.status = 'REVERSED';
    payment.reversal_reason = reason;
    payment.reversed_at = new Date().toISOString();
    setStoredItem(STORAGE_KEYS.PAYMENTS, payments);

    // Revert customer outstanding
    const customers = this.getCustomers();
    const cIdx = customers.findIndex(c => c.customer_id === payment.customer_id);
    let newBalance = 0;
    if (cIdx >= 0) {
      customers[cIdx].current_outstanding += payment.amount;
      newBalance = customers[cIdx].current_outstanding;
      setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
    }

    // Ledger reversal entry
    this.addLedgerEntry({
      entry_id: generateId('LED'),
      customer_id: payment.customer_id,
      date: getTodayDateString(),
      description: `REVERSAL: Payment ${payment.receipt_number} reversed. Reason: ${reason}`,
      reference: payment.receipt_number,
      debit: payment.amount,
      credit: 0,
      running_balance: newBalance,
      type: 'ADJUSTMENT',
    });

    const customer = this.getCustomer(payment.customer_id);
    this.logAudit({
      user_id: user.user_id,
      user_name: user.name,
      action: 'REVERSE_PAYMENT',
      entity_type: 'PAYMENT',
      entity_id: payment.payment_id,
      change_summary: `Reversed payment ₹${payment.amount} for ${customer?.name}. Reason: ${reason}`,
    });

    return { success: true };
  },

  // Ledger
  getLedger(customerId?: string): LedgerEntry[] {
    const ledgers = getStoredItem<LedgerEntry[]>(STORAGE_KEYS.LEDGERS, INITIAL_LEDGERS);
    if (customerId) {
      return ledgers.filter(l => l.customer_id === customerId);
    }
    return ledgers;
  },

  addLedgerEntry(entry: LedgerEntry): void {
    const ledgers = getStoredItem<LedgerEntry[]>(STORAGE_KEYS.LEDGERS, INITIAL_LEDGERS);
    ledgers.push(entry);
    setStoredItem(STORAGE_KEYS.LEDGERS, ledgers);
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return getStoredItem<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  },

  logAudit(entry: Omit<AuditLog, 'log_id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...entry,
      log_id: generateId('AUD'),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog); // latest first
    setStoredItem(STORAGE_KEYS.AUDIT, logs);
  },
};
