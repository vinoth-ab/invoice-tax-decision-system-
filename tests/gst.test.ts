import { describe, it, expect } from 'vitest';
import { isIntraState, calculateLineItem, calculateInvoiceTotals, roundCurrency } from '../lib/calculations/gst';

describe('GST Calculation Engine', () => {
  it('correctly distinguishes intra-state from inter-state transactions', () => {
    // Both in Tamil Nadu
    expect(isIntraState('Tamil Nadu', 'Tamil Nadu')).toBe(true);
    expect(isIntraState('33-Tamil Nadu', 'Tamil Nadu')).toBe(true);
    expect(isIntraState('Tamil Nadu', '33-Tamil Nadu')).toBe(true);

    // Tamil Nadu to Karnataka or Maharashtra
    expect(isIntraState('Tamil Nadu', 'Karnataka')).toBe(false);
    expect(isIntraState('Tamil Nadu', '29-Karnataka')).toBe(false);
    expect(isIntraState('33-Tamil Nadu', '27-Maharashtra')).toBe(false);
  });

  it('calculates intra-state line items with CGST and SGST split equally', () => {
    const result = calculateLineItem({
      quantity: 2,
      unitPrice: 1000,
      discountAmount: 200,
      gstRate: 18,
      isIntraState: true,
    });

    expect(result.taxableAmount).toBe(1800);
    expect(result.cgstRate).toBe(9);
    expect(result.sgstRate).toBe(9);
    expect(result.igstRate).toBe(0);
    expect(result.cgstAmount).toBe(162);
    expect(result.sgstAmount).toBe(162);
    expect(result.igstAmount).toBe(0);
    expect(result.totalTax).toBe(324);
    expect(result.totalAmount).toBe(2124);
  });

  it('calculates inter-state line items with IGST', () => {
    const result = calculateLineItem({
      quantity: 1,
      unitPrice: 50000,
      discountAmount: 0,
      gstRate: 18,
      isIntraState: false,
    });

    expect(result.taxableAmount).toBe(50000);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.igstAmount).toBe(9000);
    expect(result.totalTax).toBe(9000);
    expect(result.totalAmount).toBe(59000);
  });

  it('aggregates multi-item invoice totals correctly avoiding floating point errors', () => {
    const items = [
      { description: 'Cloud Nodes', quantity: 3, unit_price: 3333.33, gst_rate: 18 },
      { description: 'Domain name', quantity: 1, unit_price: 999.00, discount_amount: 100, gst_rate: 18 },
    ];

    const totals = calculateInvoiceTotals(items, 'Tamil Nadu', 'Tamil Nadu', 0);

    expect(totals.taxableAmount).toBeGreaterThan(0);
    expect(totals.cgstAmount).toBe(totals.sgstAmount);
    expect(totals.igstAmount).toBe(0);
    expect(totals.totalAmount).toBe(
      roundCurrency(totals.taxableAmount + totals.cgstAmount + totals.sgstAmount)
    );
  });
});
