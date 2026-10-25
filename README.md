# Lotus ERP — Daily Flower Delivery & Monthly Billing Management System

> **UI-First Design • Clean Architecture • Mobile-First Responsive Application**
> Built according to the Lotus ERP Business Requirements Document (BRD) v1.0 and Technical Design Document (TDD) v1.0.

---

## 🌺 Overview

**Lotus ERP** digitizes the operations of a daily Pooja flower doorstep delivery business. Customers receive daily flowers (e.g. at rates of ₹5, ₹10, ₹20, or custom amounts) and pay at the end of each billing cycle.

Lotus ERP provides:
- **Mobile-First Delivery Boy Interface**: Designed for delivery staff on morning routes on mobile phones with 1-tap touch actions (Delivered, Absent, Not Delivered), customer instructions, and direct phone dialer.
- **Admin Operations Dashboard**: Live route completion tracking, pending delivery resolution banners, monthly billing generation, outstanding balances, and collection metrics.
- **Rate History & Traceability**: Rate revisions are effective-dated to protect historical deliveries and finalized invoices from being overwritten.
- **Absence & Vacation Deductions**: Multi-day date ranges (e.g., 5-day vacation) and single-day leaves are automatically excluded from the monthly bill with overlap prevention.
- **Exact BRD Billing Engine**:
  $$\text{Monthly Flower Charge} = \sum (\text{Confirmed Eligible Deliveries} \times \text{Applicable Rate})$$
  $$\text{Total Payable} = \text{Current Charges} + \text{Previous Carry Balance} + \text{Adjustments}$$
  $$\text{Closing Balance} = \text{Total Payable} - \text{Payments Received}$$
  *(e.g., 24 billable deliveries $\times$ ₹10 = ₹240. With ₹50 opening balance, total payable = ₹290. After ₹200 payment, remaining balance = ₹90).*
- **Financial Receipts & Customer Ledger**: Print & WhatsApp shareable invoices and payment slips, with full chronological debit/credit running balances.
- **Audit Log**: Immutable audit trail for rates, delivery updates, absences, invoice locks, and payment reversals.

---

## 📱 Mobile-First Architecture

The application is engineered with a mobile-first responsive layout:
1. **Large Touch Targets**: Action buttons are minimum 44–48px for thumb taps while on delivery.
2. **Bottom Sheet Dialogs**: Modals slide up gracefully as bottom sheets on mobile viewports.
3. **Sticky Bottom Navigation**: Quick 1-touch tabs for Home, Deliveries, Customers, Billing, and Menu.
4. **Instant Role Switcher**: Switch between **Admin / Shop Owner** and **Delivery Boy (Suresh Kumar / Ramesh Patel)** directly from the top bar to test both workflows seamlessly.

---

## 🏗️ Clean Project Directory Structure

```text
c:\portfolio_web\Lotus_erp\
├── src/
│   ├── types/                  # Typed Domain Entities & Enums (TDD Section 9)
│   │   └── index.ts
│   ├── lib/                    # Core Infrastructure & Business Logic (Clean Architecture)
│   │   ├── billingEngine.ts    # BRD Billing calculation engine & validations
│   │   ├── storage.ts          # Repository layer with LocalStorage persistence & integrity rules
│   │   ├── seedData.ts         # Initial test cases & data from BRD
│   │   ├── formatters.ts       # Indian Rupee (₹), Asia/Kolkata date & phone formatters
│   │   └── utils.ts            # Classnames & ID helpers
│   ├── components/
│   │   ├── ui/                 # Reusable UI primitives (Button, Input, Select, Badge, Dialog)
│   │   ├── layout/             # AppShell, Topbar, Sidebar, MobileBottomNav
│   │   ├── data-display/       # StatCard, MoneyDisplay, DateDisplay, EmptyState
│   │   └── feedback/           # Toast, ConfirmDialog, InlineAlert
│   ├── features/               # Feature-Driven Business Modules
│   │   ├── auth/               # Role-based access control & active user context
│   │   ├── dashboard/          # Admin Dashboard & KPIs
│   │   ├── delivery/           # Daily Delivery operations & Delivery Boy Mobile Route View
│   │   ├── customers/          # Customer profiles, forms, rates history, and details
│   │   ├── absences/           # Single-day & date-range vacation management
│   │   ├── billing/            # Invoice preview, finalization, and printable flower bill
│   │   ├── payments/           # Collection recording, reversals, and WhatsApp receipts
│   │   ├── ledger/             # Customer account ledger & running balance statement
│   │   ├── staff/              # Delivery boy staff accounts & delivery areas
│   │   ├── reports/            # Financial reports & CSV data export
│   │   └── audit/              # Traceable change audit log
│   ├── styles/                 # Global Tailwind CSS and design tokens
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js          # Design tokens (#F8FAFC, #2563EB, #16A34A, #DC2626)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Running the Project

```bash
# 1. Start development server
npm run dev

# 2. Build for production
npm run build

# 3. Preview production build
npm run preview
```

Open `http://localhost:3000` in your browser. Use Chrome DevTools (press `F12` $\to$ toggle device toolbar) or load on a mobile phone to experience the mobile-first delivery route interface.
