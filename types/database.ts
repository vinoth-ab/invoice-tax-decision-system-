// ==============================================================================
// Database & Domain Types
// Integrated Invoice Analytics and Tax Optimization Decision Support System
// ==============================================================================

export type BusinessType =
  | 'Private Limited Company'
  | 'Proprietorship'
  | 'Partnership'
  | 'LLP'
  | 'Public Limited Company';

export type PartyType = 'customer' | 'supplier' | 'both';

export type InvoiceType = 'sales' | 'purchase';

export type PaymentStatus =
  | 'draft'
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type SchemeCategory =
  | 'tax_deduction'
  | 'presumptive_taxation'
  | 'gst_composition'
  | 'subsidy_grant'
  | 'credit_guarantee'
  | 'loan_scheme'
  | 'registration_benefit';

export type VerificationStatus = 'verified' | 'needs_verification' | 'expired';

export type AnomalySeverity = 'low' | 'medium' | 'high';

export type AnomalyStatus = 'open' | 'investigating' | 'dismissed' | 'resolved';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string | null;
  business_name: string;
  business_type: BusinessType | string;
  industry: string;
  address: string;
  district: string;
  state: string;
  financial_year: string;
  gst_registered: boolean;
  gstin: string | null;
  startup_recognized: boolean;
  annual_turnover: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Party {
  id: string;
  business_id: string;
  party_name: string;
  party_type: PartyType;
  email: string | null;
  phone: string | null;
  address: string | null;
  state: string;
  gstin: string | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  party_id: string | null;
  party?: Party | null;
  invoice_number: string;
  invoice_type: InvoiceType;
  invoice_date: string;
  due_date: string;
  financial_year: string;
  place_of_supply: string;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_status: PaymentStatus;
  notes: string | null;
  document_path: string | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  hsn_sac_code?: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  gst_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  created_at?: string;
}

export interface TaxScheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  administering_authority: string;
  category: SchemeCategory;
  description: string;
  applicable_business_types: string[];
  eligibility_criteria: Record<string, any>;
  benefit_description: string;
  tax_regime: string | null;
  effective_from: string | null;
  effective_to: string | null;
  official_source_url: string;
  official_source_title: string;
  last_verified_at: string | null;
  verification_status: VerificationStatus;
  is_active: boolean;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaxAssessment {
  id: string;
  business_id: string;
  financial_year: string;
  assessment_date: string;
  turnover_used: number;
  estimated_taxable_income: number | null;
  potential_benefits: any[];
  estimated_tax_savings: number;
  assumptions: Record<string, any>;
  warnings: string[];
  disclaimer: string;
  created_at: string;
}

export interface AnomalyAlert {
  id: string;
  business_id: string;
  invoice_id: string | null;
  invoice?: Invoice | null;
  anomaly_type: string;
  severity: AnomalySeverity;
  description: string;
  evidence: Record<string, any>;
  status: AnomalyStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface InvoiceFile {
  id: string;
  business_id: string;
  invoice_id: string | null;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  upload_status: 'uploaded' | 'processing' | 'attached' | 'failed';
  created_at: string;
}

// Financial KPI summaries
export interface DashboardMetrics {
  totalSales: number;
  totalPurchases: number;
  totalTaxableSales: number;
  totalSalesGst: number;
  totalInputGst: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  overdueInvoicesCount: number;
  overdueAmount: number;
  totalInvoicesCount: number;
  collectionRate: number;
  averageInvoiceValue: number;
  monthlyTrends: Array<{
    month: string;
    sales: number;
    purchases: number;
    gstCollected: number;
    inputGst: number;
  }>;
  gstBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
  };
  paymentStatusCounts: Record<PaymentStatus, number>;
}
