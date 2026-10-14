// ==============================================================================
// GST Calculation & Reconciliation Engine
// Authoritative decimal arithmetic without floating-point precision loss
// ==============================================================================

import { InvoiceItem } from '@/types/database';

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
] as const;

export const STANDARD_GST_RATES = [0, 5, 12, 18, 28] as const;

/**
 * Clean state name by removing leading GST code if present (e.g., '33-Tamil Nadu' -> 'Tamil Nadu')
 */
export function normalizeState(state: string | null | undefined): string {
  if (!state) return '';
  return state.replace(/^\d{2}\s*-\s*/, '').trim().toLowerCase();
}

/**
 * Determine if transaction is Intra-State (same state -> CGST + SGST) or Inter-State (IGST)
 */
export function isIntraState(businessState: string, placeOfSupply: string): boolean {
  const norm1 = normalizeState(businessState);
  const norm2 = normalizeState(placeOfSupply);
  if (!norm1 || !norm2) return true; // Default to intra-state if undefined
  return norm1 === norm2;
}

/**
 * Precise rounding to 2 decimal places to avoid floating point bugs
 */
export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export interface LineItemCalculationInput {
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  gstRate: number; // e.g., 18 for 18%
  isIntraState: boolean;
}

export interface LineItemCalculationResult {
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

/**
 * Authoritative line-item calculator
 */
export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculationResult {
  const qty = Math.max(0, input.quantity || 0);
  const price = Math.max(0, input.unitPrice || 0);
  const discount = Math.max(0, input.discountAmount || 0);
  const rate = Math.max(0, input.gstRate || 0);

  const baseGross = roundCurrency(qty * price);
  const taxableAmount = Math.max(0, roundCurrency(baseGross - discount));

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (input.isIntraState) {
    cgstRate = rate / 2;
    sgstRate = rate / 2;
    cgstAmount = roundCurrency(taxableAmount * (cgstRate / 100));
    sgstAmount = roundCurrency(taxableAmount * (sgstRate / 100));
  } else {
    igstRate = rate;
    igstAmount = roundCurrency(taxableAmount * (igstRate / 100));
  }

  const totalTax = roundCurrency(cgstAmount + sgstAmount + igstAmount);
  const totalAmount = roundCurrency(taxableAmount + totalTax);

  return {
    taxableAmount,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    totalAmount,
  };
}

export interface InvoiceTotalsCalculation {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  totalAmount: number;
  calculatedItems: InvoiceItem[];
}

/**
 * Recalculate authoritative invoice totals from a set of raw line items
 */
export function calculateInvoiceTotals(
  items: Array<Partial<InvoiceItem>>,
  businessState: string,
  placeOfSupply: string,
  cessAmount: number = 0
): InvoiceTotalsCalculation {
  const intra = isIntraState(businessState, placeOfSupply);

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const calculatedItems: InvoiceItem[] = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unit_price) || 0;
    const discount = Number(item.discount_amount) || 0;
    const gstRate = Number(item.gst_rate) || 0;

    const calc = calculateLineItem({
      quantity: qty,
      unitPrice,
      discountAmount: discount,
      gstRate,
      isIntraState: intra,
    });

    subtotal = roundCurrency(subtotal + qty * unitPrice);
    totalDiscount = roundCurrency(totalDiscount + discount);
    totalTaxable = roundCurrency(totalTaxable + calc.taxableAmount);
    totalCgst = roundCurrency(totalCgst + calc.cgstAmount);
    totalSgst = roundCurrency(totalSgst + calc.sgstAmount);
    totalIgst = roundCurrency(totalIgst + calc.igstAmount);

    return {
      description: item.description || '',
      hsn_sac_code: item.hsn_sac_code || null,
      quantity: qty,
      unit_price: unitPrice,
      discount_amount: discount,
      gst_rate: gstRate,
      taxable_amount: calc.taxableAmount,
      cgst_amount: calc.cgstAmount,
      sgst_amount: calc.sgstAmount,
      igst_amount: calc.igstAmount,
      total_amount: calc.totalAmount,
    };
  });

  const safeCess = roundCurrency(Math.max(0, cessAmount || 0));
  const totalTax = roundCurrency(totalCgst + totalSgst + totalIgst + safeCess);
  const totalAmount = roundCurrency(totalTaxable + totalTax);

  return {
    subtotal,
    discountAmount: totalDiscount,
    taxableAmount: totalTaxable,
    cgstAmount: totalCgst,
    sgstAmount: totalSgst,
    igstAmount: totalIgst,
    cessAmount: safeCess,
    totalTax,
    totalAmount,
    calculatedItems,
  };
}
