import { describe, it, expect } from 'vitest';
import { detectInvoiceAnomalies } from '../lib/anomaly-detection/engine';
import { Invoice } from '../types/database';

describe('Invoice Anomaly Detection Engine', () => {
  const baseInvoice: Invoice = {
    id: 'inv-1',
    business_id: 'b-1',
    party_id: 'p-1',
    invoice_number: 'INV-001',
    invoice_type: 'sales',
    invoice_date: '2024-05-10',
    due_date: '2024-06-10',
    financial_year: '2024-2025',
    place_of_supply: 'Tamil Nadu',
    subtotal: 100000,
    discount_amount: 0,
    taxable_amount: 100000,
    cgst_amount: 9000,
    sgst_amount: 9000,
    igst_amount: 0,
    cess_amount: 0,
    total_amount: 118000,
    amount_paid: 118000,
    payment_status: 'paid',
    notes: null,
    document_path: null,
    is_sample: false,
    created_at: '',
    updated_at: '',
  };

  it('detects duplicate invoice numbers within the business', () => {
    const invoices: Invoice[] = [
      baseInvoice,
      { ...baseInvoice, id: 'inv-2' }, // Same invoice number
    ];

    const alerts = detectInvoiceAnomalies(invoices, 'Tamil Nadu');
    const dupAlert = alerts.find((a) => a.anomalyType === 'DUPLICATE_INVOICE_NUMBER');
    expect(dupAlert).toBeDefined();
    expect(dupAlert?.severity).toBe('high');
  });

  it('detects tax treatment mismatch when intra-state has IGST applied', () => {
    const invoices: Invoice[] = [
      {
        ...baseInvoice,
        place_of_supply: 'Tamil Nadu',
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 18000, // Should be CGST + SGST for intra-state
      },
    ];

    const alerts = detectInvoiceAnomalies(invoices, 'Tamil Nadu');
    const taxAlert = alerts.find((a) => a.anomalyType === 'TAX_TREATMENT_MISMATCH');
    expect(taxAlert).toBeDefined();
    expect(taxAlert?.severity).toBe('medium');
  });

  it('detects statistical value outliers exceeding historical multiple', () => {
    const invoices: Invoice[] = [
      { ...baseInvoice, id: '1', total_amount: 100000 },
      { ...baseInvoice, id: '2', total_amount: 110000 },
      { ...baseInvoice, id: '3', total_amount: 95000 },
      { ...baseInvoice, id: '4', total_amount: 2500000 }, // Outlier: 25 Lakhs vs ~1 Lakh avg
    ];

    const alerts = detectInvoiceAnomalies(invoices, 'Tamil Nadu', { historicalMeanMultiplier: 3 });
    const outlier = alerts.find((a) => a.anomalyType === 'STATISTICAL_VALUE_OUTLIER');
    expect(outlier).toBeDefined();
    expect(outlier?.invoiceId).toBe('4');
  });

  it('detects calculation discrepancies when sum of components does not equal total', () => {
    const invoices: Invoice[] = [
      {
        ...baseInvoice,
        taxable_amount: 100000,
        cgst_amount: 9000,
        sgst_amount: 9000,
        total_amount: 150000, // Discrepancy of 32,000
      },
    ];

    const alerts = detectInvoiceAnomalies(invoices, 'Tamil Nadu');
    const calcAlert = alerts.find((a) => a.anomalyType === 'CALCULATION_DISCREPANCY');
    expect(calcAlert).toBeDefined();
    expect(calcAlert?.severity).toBe('high');
  });
});
