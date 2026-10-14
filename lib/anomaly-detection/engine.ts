// ==============================================================================
// Rule-Based Invoice Anomaly Detection Engine
// Deterministic baseline with extension point for statistical & ML detectors
// ==============================================================================

import { Invoice, AnomalyAlert, AnomalySeverity } from '@/types/database';
import { isIntraState, STANDARD_GST_RATES, roundCurrency } from '@/lib/calculations/gst';

export interface AnomalyDetectionOptions {
  historicalMeanMultiplier?: number; // Flag if invoice > mean * multiplier (default: 4.5)
  overdueGraceDays?: number; // Days past due date before flagging (default: 7)
  referenceDate?: string;
}

export interface DetectedAnomaly {
  invoiceId: string;
  invoiceNumber: string;
  anomalyType: string;
  severity: AnomalySeverity;
  description: string;
  evidence: Record<string, any>;
}

/**
 * Scan a list of invoices for anomalies according to Indian GST & accounting rules
 */
export function detectInvoiceAnomalies(
  invoices: Invoice[],
  businessState: string,
  options: AnomalyDetectionOptions = {}
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  const multiplier = options.historicalMeanMultiplier ?? 4.5;
  const graceDays = options.overdueGraceDays ?? 7;
  const today = options.referenceDate ? new Date(options.referenceDate) : new Date('2025-03-31');

  // 1. Calculate historical metrics for statistical outlier detection
  const validAmounts = invoices
    .filter((inv) => inv.payment_status !== 'cancelled' && inv.total_amount > 0)
    .map((inv) => inv.total_amount);

  const totalSum = validAmounts.reduce((a, b) => a + b, 0);
  const meanAmount = validAmounts.length > 0 ? totalSum / validAmounts.length : 0;

  // Track invoice numbers for duplicate detection
  const numberCounts = new Map<string, Invoice[]>();

  // Track party + date + amount combinations
  const signatureMap = new Map<string, Invoice[]>();

  for (const inv of invoices) {
    // Collect for duplicate number check
    const num = (inv.invoice_number || '').trim().toUpperCase();
    if (num) {
      const list = numberCounts.get(num) || [];
      list.push(inv);
      numberCounts.set(num, list);
    }

    // Collect for party+date+amount duplicate pattern
    const partyKey = inv.party_id || 'unknown';
    const sig = `${partyKey}_${inv.invoice_date}_${Math.round(inv.total_amount)}`;
    const sigList = signatureMap.get(sig) || [];
    sigList.push(inv);
    signatureMap.set(sig, sigList);

    // 2. CHECK: Negative or Zero Totals
    if (inv.total_amount <= 0 && inv.payment_status !== 'cancelled') {
      anomalies.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        anomalyType: 'ZERO_OR_NEGATIVE_TOTAL',
        severity: 'high',
        description: `Invoice ${inv.invoice_number} has an invalid non-positive total amount (₹${inv.total_amount}).`,
        evidence: {
          subtotal: inv.subtotal,
          total_amount: inv.total_amount,
          status: inv.payment_status,
        },
      });
    }

    // 3. CHECK: Place of Supply & Tax Treatment Mismatch
    const intra = isIntraState(businessState, inv.place_of_supply);
    if (intra) {
      // Intra-state should have CGST & SGST, and 0 IGST
      if (inv.igst_amount > 0 && inv.taxable_amount > 0) {
        anomalies.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          anomalyType: 'TAX_TREATMENT_MISMATCH',
          severity: 'medium',
          description: `Place of supply (${inv.place_of_supply}) is intra-state with business state (${businessState}), but IGST (₹${inv.igst_amount}) was recorded instead of CGST/SGST.`,
          evidence: {
            businessState,
            placeOfSupply: inv.place_of_supply,
            igstAmount: inv.igst_amount,
            cgstAmount: inv.cgst_amount,
            sgstAmount: inv.sgst_amount,
          },
        });
      }
    } else {
      // Inter-state should have IGST, and 0 CGST/SGST
      if ((inv.cgst_amount > 0 || inv.sgst_amount > 0) && inv.taxable_amount > 0) {
        anomalies.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          anomalyType: 'TAX_TREATMENT_MISMATCH',
          severity: 'medium',
          description: `Place of supply (${inv.place_of_supply}) is inter-state relative to business state (${businessState}), but local CGST/SGST was recorded instead of IGST.`,
          evidence: {
            businessState,
            placeOfSupply: inv.place_of_supply,
            cgstAmount: inv.cgst_amount,
            sgstAmount: inv.sgst_amount,
            igstAmount: inv.igst_amount,
          },
        });
      }
    }

    // 4. CHECK: Total Reconciliation Mismatch
    const expectedTotal = roundCurrency(
      inv.taxable_amount + inv.cgst_amount + inv.sgst_amount + inv.igst_amount + inv.cess_amount
    );
    const diff = Math.abs(expectedTotal - inv.total_amount);
    if (diff > 1.0 && inv.payment_status !== 'cancelled') {
      anomalies.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        anomalyType: 'CALCULATION_DISCREPANCY',
        severity: 'high',
        description: `Invoice ${inv.invoice_number} arithmetic mismatch: Taxable (₹${inv.taxable_amount}) + Taxes does not equal recorded total (₹${inv.total_amount}). Discrepancy: ₹${diff.toFixed(2)}.`,
        evidence: {
          recordedTotal: inv.total_amount,
          expectedTotal,
          difference: diff,
        },
      });
    }

    // 5. CHECK: Statistical Value Outlier
    if (meanAmount > 0 && inv.total_amount > meanAmount * multiplier) {
      anomalies.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        anomalyType: 'STATISTICAL_VALUE_OUTLIER',
        severity: 'high',
        description: `Invoice amount (₹${inv.total_amount.toLocaleString('en-IN')}) is ${(inv.total_amount / meanAmount).toFixed(1)}x higher than the business historical mean (₹${Math.round(meanAmount).toLocaleString('en-IN')}).`,
        evidence: {
          invoiceAmount: inv.total_amount,
          historicalMean: Math.round(meanAmount),
          ratio: Number((inv.total_amount / meanAmount).toFixed(2)),
        },
      });
    }

    // 6. CHECK: Overdue Invoices
    if (inv.due_date && (inv.payment_status === 'overdue' || inv.payment_status === 'unpaid' || inv.payment_status === 'partially_paid')) {
      const dueDate = new Date(inv.due_date);
      const diffTime = today.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (daysOverdue > graceDays) {
        const unpaidBalance = roundCurrency(inv.total_amount - (inv.amount_paid || 0));
        if (unpaidBalance > 0) {
          anomalies.push({
            invoiceId: inv.id,
            invoiceNumber: inv.invoice_number,
            anomalyType: 'OVERDUE_PAYMENT_RISK',
            severity: daysOverdue > 45 ? 'high' : 'medium',
            description: `Invoice ${inv.invoice_number} is ${daysOverdue} days past due date (${inv.due_date}) with an unpaid balance of ₹${unpaidBalance.toLocaleString('en-IN')}.`,
            evidence: {
              dueDate: inv.due_date,
              daysOverdue,
              unpaidBalance,
              totalAmount: inv.total_amount,
              amountPaid: inv.amount_paid,
            },
          });
        }
      }
    }

    // 7. CHECK: Non-standard GST Rates on items
    if (inv.items && inv.items.length > 0) {
      for (const item of inv.items) {
        const rate = Number(item.gst_rate);
        if (!STANDARD_GST_RATES.includes(rate as any)) {
          anomalies.push({
            invoiceId: inv.id,
            invoiceNumber: inv.invoice_number,
            anomalyType: 'UNUSUAL_GST_RATE',
            severity: 'low',
            description: `Item "${item.description}" has a non-standard GST rate of ${rate}% (Standard rates: 0%, 5%, 12%, 18%, 28%).`,
            evidence: {
              itemDescription: item.description,
              rate,
              standardRates: STANDARD_GST_RATES,
            },
          });
        }
      }
    }
  }

  // 8. CHECK: Duplicate Invoice Numbers
  for (const [num, list] of numberCounts.entries()) {
    if (list.length > 1) {
      for (const inv of list) {
        anomalies.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          anomalyType: 'DUPLICATE_INVOICE_NUMBER',
          severity: 'high',
          description: `Duplicate invoice number "${num}" detected across ${list.length} separate records in this business.`,
          evidence: {
            conflictingInvoiceIds: list.map((l) => l.id),
            count: list.length,
          },
        });
      }
    }
  }

  // 9. CHECK: Suspected Duplicate Billing Pattern (same party, date, and amount)
  for (const [_, list] of signatureMap.entries()) {
    if (list.length > 1) {
      for (const inv of list) {
        const otherInvoices = list.filter((l) => l.id !== inv.id).map((l) => l.invoice_number);
        anomalies.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          anomalyType: 'SUSPICIOUS_DUPLICATE_PATTERN',
          severity: 'high',
          description: `Potential duplicate billing: Identical party, date (${inv.invoice_date}), and amount (₹${inv.total_amount}) matches invoice(s): ${otherInvoices.join(', ')}.`,
          evidence: {
            partyId: inv.party_id,
            invoiceDate: inv.invoice_date,
            totalAmount: inv.total_amount,
            matchingInvoiceNumbers: otherInvoices,
          },
        });
      }
    }
  }

  return anomalies;
}
