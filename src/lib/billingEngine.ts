import { Customer, Invoice } from '../types';
import { StorageService } from './storage';
import { generateId } from './utils';

export interface BillPreviewResult {
  customer: Customer;
  billingMonth: string;
  totalCalendarDays: number;
  billableDays: number;
  absenceDays: number;
  notDeliveredDays: number;
  pendingDays: number;
  dailyRate: number;
  currentCharges: number;
  openingBalance: number;
  adjustments: number;
  totalPayable: number;
  amountPaid: number;
  closingBalance: number;
  eligibleDeliveryDates: string[];
  absenceDates: string[];
  unresolvedPendingCount: number;
}

export const BillingEngine = {
  /**
   * Get total days in a month (e.g. 2026-10 has 31 days, 2026-11 has 30 days, Feb 28/29)
   */
  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  },

  /**
   * Calculate billing preview for a single customer for a given month (YYYY-MM)
   */
  calculateCustomerBillPreview(customerId: string, billingMonth: string): BillPreviewResult | null {
    const customer = StorageService.getCustomer(customerId);
    if (!customer) return null;

    const [yearStr, monthStr] = billingMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const totalCalendarDays = this.getDaysInMonth(year, month);

    // Get all deliveries for this month
    const allDeliveries = StorageService.getDeliveries();
    const customerDeliveries = allDeliveries.filter(d => {
      return d.customer_id === customerId && d.delivery_date.startsWith(billingMonth);
    });

    // Check absences for this customer covering dates in this month
    const absences = StorageService.getAbsences().filter(
      a => a.customer_id === customerId && a.status === 'APPROVED'
    );

    // Compute day by day
    let billableDays = 0;
    let absenceDays = 0;
    let notDeliveredDays = 0;
    let pendingDays = 0;
    let currentCharges = 0;
    const eligibleDeliveryDates: string[] = [];
    const absenceDates: string[] = [];

    // Check for each calendar day of the month
    for (let day = 1; day <= totalCalendarDays; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${billingMonth}-${dayStr}`;

      // Respect customer service start date and end date
      if (customer.start_date && dateStr < customer.start_date) {
        continue;
      }
      if (customer.end_date && dateStr > customer.end_date) {
        continue;
      }

      // Check if day falls within any approved absence
      const isAbsent = absences.some(a => {
        return dateStr >= a.start_date && dateStr <= a.end_date;
      });

      if (isAbsent) {
        absenceDays++;
        absenceDates.push(dateStr);
        continue; // Excluded from billing
      }

      // Check delivery record for this day
      const delivery = customerDeliveries.find(d => d.delivery_date === dateStr);
      if (!delivery) {
        // If no record exists for a past/current date, it's considered unrecorded/pending
        pendingDays++;
      } else {
        if (delivery.status === 'DELIVERED') {
          billableDays++;
          eligibleDeliveryDates.push(dateStr);
          // Rate effective on delivery date
          const billAmount = delivery.billable_amount > 0 ? delivery.billable_amount : customer.current_rate;
          currentCharges += billAmount;
        } else if (delivery.status === 'VACATION' || delivery.status === 'CUSTOMER_ABSENT') {
          absenceDays++;
          absenceDates.push(dateStr);
        } else if (delivery.status === 'NOT_DELIVERED') {
          notDeliveredDays++;
        } else if (delivery.status === 'PENDING') {
          pendingDays++;
        }
      }
    }

    // Opening balance from previous month or customer record
    // Look up previous month invoices to check closing balance
    const existingInvoices = StorageService.getInvoices().filter(i => i.customer_id === customerId);
    let openingBalance = customer.opening_balance;
    
    // Total payable calculation: Opening balance + Current charges - adjustments
    const adjustments = 0;
    const totalPayable = openingBalance + currentCharges + adjustments;

    // Check payments received in this billing cycle
    const payments = StorageService.getPayments().filter(
      p => p.customer_id === customerId && p.status === 'COMPLETED' && p.payment_date.startsWith(billingMonth)
    );
    const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const closingBalance = Math.max(0, totalPayable - amountPaid);

    return {
      customer,
      billingMonth,
      totalCalendarDays,
      billableDays,
      absenceDays,
      notDeliveredDays,
      pendingDays,
      dailyRate: customer.current_rate,
      currentCharges,
      openingBalance,
      adjustments,
      totalPayable,
      amountPaid,
      closingBalance,
      eligibleDeliveryDates,
      absenceDates,
      unresolvedPendingCount: pendingDays,
    };
  },

  /**
   * Generate billing preview for all active customers for a billing month
   */
  generateAllInvoicesPreview(billingMonth: string): BillPreviewResult[] {
    const customers = StorageService.getCustomers().filter(c => c.status === 'ACTIVE');
    const previews: BillPreviewResult[] = [];

    customers.forEach(cust => {
      const preview = this.calculateCustomerBillPreview(cust.customer_id, billingMonth);
      if (preview) {
        previews.push(preview);
      }
    });

    return previews;
  },

  /**
   * Convert a preview result to a persistent invoice entity
   */
  createInvoiceFromPreview(preview: BillPreviewResult): Invoice {
    const monthCode = preview.billingMonth.replace('-', '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `LOTUS-INV-${monthCode}-${randomSuffix}`;
    
    // Set due date 7 days into following month
    const [y, m] = preview.billingMonth.split('-');
    const nextMonth = parseInt(m, 10) === 12 ? 1 : parseInt(m, 10) + 1;
    const nextYear = parseInt(m, 10) === 12 ? parseInt(y, 10) + 1 : parseInt(y, 10);
    const dueDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-07`;

    let status: Invoice['status'] = 'FINALIZED';
    if (preview.closingBalance === 0 && preview.amountPaid > 0) {
      status = 'PAID';
    } else if (preview.amountPaid > 0 && preview.closingBalance > 0) {
      status = 'PARTIALLY_PAID';
    }

    return {
      invoice_id: generateId('INV'),
      invoice_number: invoiceNumber,
      customer_id: preview.customer.customer_id,
      billing_month: preview.billingMonth,
      total_calendar_days: preview.totalCalendarDays,
      billable_days: preview.billableDays,
      absence_days: preview.absenceDays,
      other_non_billable_days: preview.notDeliveredDays,
      daily_rate: preview.dailyRate,
      current_charges: preview.currentCharges,
      opening_balance: preview.openingBalance,
      adjustments: preview.adjustments,
      total_payable: preview.totalPayable,
      amount_paid: preview.amountPaid,
      closing_balance: preview.closingBalance,
      status,
      created_at: new Date().toISOString(),
      finalized_at: new Date().toISOString(),
      due_date: dueDate,
    };
  },
};
