'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useBusiness } from '@/lib/context/BusinessContext';
import { fetchInvoices, saveInvoice } from '@/lib/data/store';
import { formatINR, formatIndianDate } from '@/lib/calculations/currency';
import { Invoice, PaymentStatus } from '@/types/database';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  FileCheck,
  Building,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { selectedBusiness } = useBusiness();
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  useEffect(() => {
    params.then((p) => setInvoiceId(p.id));
  }, [params]);

  const loadInvoice = async () => {
    if (!selectedBusiness || !invoiceId) return;
    setIsLoading(true);
    try {
      const invoices = await fetchInvoices(selectedBusiness.id);
      const found = invoices.find((i) => i.id === invoiceId) || null;
      setInvoice(found);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId, selectedBusiness]);

  const handlePrint = () => {
    window.print();
  };

  const handleRecordPayment = async () => {
    if (!invoice) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSavingPayment(true);
    try {
      const newPaid = Math.min(invoice.total_amount, (invoice.amount_paid || 0) + amount);
      const newStatus: PaymentStatus = newPaid >= invoice.total_amount ? 'paid' : 'partially_paid';

      await saveInvoice(
        {
          ...invoice,
          amount_paid: newPaid,
          payment_status: newStatus,
        },
        invoice.items || []
      );

      await loadInvoice();
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-slate-400 text-xs">Loading invoice document...</div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="py-20 text-center space-y-3">
          <p className="text-slate-600 font-medium text-sm">Invoice not found.</p>
          <Link href="/invoices">
            <Button size="sm" variant="outline">
              Return to Invoices
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const taxes = (invoice.cgst_amount || 0) + (invoice.sgst_amount || 0) + (invoice.igst_amount || 0) + (invoice.cess_amount || 0);
  const balance = Math.max(0, invoice.total_amount - (invoice.amount_paid || 0));

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href="/invoices" className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </Link>
          <div className="flex items-center gap-2">
            {balance > 0 && invoice.payment_status !== 'cancelled' && invoice.payment_status !== 'draft' && (
              <Button
                size="sm"
                variant="outline"
                icon={<CreditCard className="w-3.5 h-3.5" />}
                onClick={() => {
                  setPaymentAmount(balance.toString());
                  setIsPaymentModalOpen(true);
                }}
              >
                Record Payment
              </Button>
            )}
            <Button
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print Tax Invoice
            </Button>
          </div>
        </div>

        {/* Tax Invoice Document Paper */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-8 font-sans print:border-none print:shadow-none print:p-0">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600">
                GST Tax Invoice • {invoice.invoice_type.toUpperCase()}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {selectedBusiness?.business_name || 'Business Enterprise'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {selectedBusiness?.address}, {selectedBusiness?.district}, {selectedBusiness?.state}
              </p>
              {selectedBusiness?.gstin && (
                <p className="text-xs font-mono text-slate-700 mt-1">
                  <strong>GSTIN:</strong> {selectedBusiness.gstin}
                </p>
              )}
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <div className="inline-block">
                <StatusBadge status={invoice.payment_status} />
              </div>
              <p className="font-mono text-base font-bold text-slate-900 mt-2">
                {invoice.invoice_number}
              </p>
              <p className="text-slate-500">
                Invoice Date: <span className="font-medium text-slate-800">{formatIndianDate(invoice.invoice_date)}</span>
              </p>
              <p className="text-slate-500">
                Due Date: <span className="font-medium text-slate-800">{formatIndianDate(invoice.due_date)}</span>
              </p>
              <p className="text-slate-500">
                Place of Supply: <span className="font-medium text-slate-800">{invoice.place_of_supply}</span>
              </p>
            </div>
          </div>

          {/* Bill To / Party Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg text-xs">
            <div>
              <p className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
                {invoice.invoice_type === 'sales' ? 'Billed To (Customer):' : 'Billed From (Supplier):'}
              </p>
              <p className="text-sm font-bold text-slate-900">{invoice.party?.party_name || 'Party Name'}</p>
              <p className="text-slate-600 mt-0.5">{invoice.party?.address || 'Address on record'}</p>
              <p className="text-slate-600">{invoice.party?.state}</p>
              {invoice.party?.gstin ? (
                <p className="font-mono text-slate-700 mt-1">
                  <strong>GSTIN:</strong> {invoice.party.gstin}
                </p>
              ) : (
                <p className="text-slate-400 mt-1 italic">Unregistered Person (URP)</p>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <p className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
                Transaction Profile:
              </p>
              <p className="text-slate-600">
                Supply Type: <strong>{invoice.place_of_supply.includes(selectedBusiness?.state || 'Tamil Nadu') ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}</strong>
              </p>
              <p className="text-slate-600">Financial Year: <strong>{invoice.financial_year}</strong></p>
              <p className="text-slate-600">
                Amount Paid: <strong className="text-emerald-600">{formatINR(invoice.amount_paid)}</strong>
              </p>
              <p className="text-slate-600">
                Outstanding Balance: <strong className="text-rose-600">{formatINR(balance)}</strong>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b-2 border-slate-200 uppercase font-semibold text-[10px] text-slate-600">
                <tr>
                  <th className="py-2.5">#</th>
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5">HSN/SAC</th>
                  <th className="py-2.5 text-right">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Taxable</th>
                  <th className="py-2.5 text-center">GST Rate</th>
                  <th className="py-2.5 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoice.items && invoice.items.length > 0 ? invoice.items : [
                  {
                    description: 'IT Consulting & Engineering',
                    hsn_sac_code: '998313',
                    quantity: 1,
                    unit_price: invoice.taxable_amount,
                    taxable_amount: invoice.taxable_amount,
                    gst_rate: 18,
                    total_amount: invoice.total_amount,
                  }
                ]).map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3 text-slate-400">{idx + 1}</td>
                    <td className="py-3 font-semibold text-slate-900">{item.description}</td>
                    <td className="py-3 font-mono text-slate-600">{item.hsn_sac_code || '-'}</td>
                    <td className="py-3 text-right font-mono">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">{formatINR(item.unit_price)}</td>
                    <td className="py-3 text-right font-mono">{formatINR(item.taxable_amount || item.unit_price * item.quantity)}</td>
                    <td className="py-3 text-center font-mono">{item.gst_rate}%</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invoice Totals Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 pt-6">
            <div className="max-w-md text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
                Declaration & Notes:
              </p>
              <p>{invoice.notes || 'Payment terms: 30 days from invoice date. We declare that this invoice shows the actual price of the goods or services described and that all particulars are true and correct.'}</p>
              <p className="font-mono text-[11px] text-slate-600 pt-2">
                Electronic Tax Invoice Generated via Integrated Invoice Analytics System.
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 text-xs text-slate-600 divide-y divide-slate-100">
              <div className="flex justify-between py-1">
                <span>Subtotal:</span>
                <span className="font-mono">{formatINR(invoice.subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">- {formatINR(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 font-semibold text-slate-800">
                <span>Taxable Amount:</span>
                <span className="font-mono">{formatINR(invoice.taxable_amount)}</span>
              </div>
              {invoice.cgst_amount > 0 && (
                <div className="flex justify-between py-1">
                  <span>CGST:</span>
                  <span className="font-mono">{formatINR(invoice.cgst_amount)}</span>
                </div>
              )}
              {invoice.sgst_amount > 0 && (
                <div className="flex justify-between py-1">
                  <span>SGST:</span>
                  <span className="font-mono">{formatINR(invoice.sgst_amount)}</span>
                </div>
              )}
              {invoice.igst_amount > 0 && (
                <div className="flex justify-between py-1">
                  <span>IGST:</span>
                  <span className="font-mono">{formatINR(invoice.igst_amount)}</span>
                </div>
              )}
              {invoice.cess_amount > 0 && (
                <div className="flex justify-between py-1">
                  <span>Cess:</span>
                  <span className="font-mono">{formatINR(invoice.cess_amount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 text-base font-bold text-slate-900 border-t-2 border-slate-900 pt-2">
                <span>Total Amount:</span>
                <span className="text-blue-600 font-mono">{formatINR(invoice.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Record Payment Modal */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Record Payment"
          description={`Invoice #${invoice.invoice_number} • Balance: ${formatINR(balance)}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleRecordPayment} isLoading={isSavingPayment}>
                Record Payment
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
