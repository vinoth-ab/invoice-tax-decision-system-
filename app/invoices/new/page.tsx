'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useBusiness } from '@/lib/context/BusinessContext';
import { fetchParties, saveInvoice, saveParty } from '@/lib/data/store';
import {
  calculateInvoiceTotals,
  isIntraState,
  INDIAN_STATES,
  STANDARD_GST_RATES,
} from '@/lib/calculations/gst';
import { formatINR } from '@/lib/calculations/currency';
import { Party, InvoiceItem, InvoiceType, PaymentStatus } from '@/types/database';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Building,
  Calendar,
  Save,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { InvoiceAttachmentUpload } from '@/components/invoices/InvoiceAttachmentUpload';
import { InvoiceAttachmentMetadata, encodeAttachment } from '@/lib/storage/attachments';

export default function NewInvoicePage() {
  const router = useRouter();
  const { selectedBusiness } = useBusiness();

  const [parties, setParties] = useState<Party[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('sales');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-2024-101');
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('2024-10-15');
  const [dueDate, setDueDate] = useState<string>('2024-11-15');
  const [placeOfSupply, setPlaceOfSupply] = useState<string>('Tamil Nadu');
  const [cessAmount, setCessAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [attachment, setAttachment] = useState<InvoiceAttachmentMetadata | null>(null);

  useEffect(() => {
    // Generate real-time invoice number and dates only on client mount
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    const today = new Date().toISOString().split('T')[0];
    setInvoiceDate(today);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split('T')[0]);
  }, []);

  // Line items
  const [items, setItems] = useState<Array<Partial<InvoiceItem>>>([
    {
      description: 'Software Engineering Services',
      hsn_sac_code: '998313',
      quantity: 1,
      unit_price: 50000,
      discount_amount: 0,
      gst_rate: 18,
    },
  ]);

  // Quick Party Creation Modal
  const [isPartyModalOpen, setIsPartyModalOpen] = useState<boolean>(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyType, setNewPartyType] = useState<'customer' | 'supplier'>('customer');
  const [newPartyState, setNewPartyState] = useState('Tamil Nadu');
  const [newPartyGstin, setNewPartyGstin] = useState('');
  const [isSavingParty, setIsSavingParty] = useState(false);

  useEffect(() => {
    if (!selectedBusiness) return;
    setPlaceOfSupply(selectedBusiness.state || 'Tamil Nadu');
    fetchParties(selectedBusiness.id).then((pList) => {
      setParties(pList);
      if (pList.length > 0) {
        setSelectedPartyId(pList[0].id);
        if (pList[0].state) {
          setPlaceOfSupply(pList[0].state);
        }
      }
    });
  }, [selectedBusiness]);

  // Update place of supply when party is selected
  const handlePartyChange = (partyId: string) => {
    setSelectedPartyId(partyId);
    const p = parties.find((item) => item.id === partyId);
    if (p && p.state) {
      setPlaceOfSupply(p.state);
    }
  };

  // Determine intra-state tax status
  const intra = useMemo(() => {
    const bState = selectedBusiness?.state || 'Tamil Nadu';
    return isIntraState(bState, placeOfSupply);
  }, [selectedBusiness, placeOfSupply]);

  // Real-time calculation of line items and totals
  const totals = useMemo(() => {
    const bState = selectedBusiness?.state || 'Tamil Nadu';
    return calculateInvoiceTotals(items, bState, placeOfSupply, cessAmount);
  }, [items, selectedBusiness, placeOfSupply, cessAmount]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        hsn_sac_code: '',
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        gst_rate: 18,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveInvoice = async (status: PaymentStatus) => {
    setErrorMsg(null);
    if (!invoiceNumber.trim()) {
      setErrorMsg('Invoice number is required.');
      return;
    }
    if (!selectedPartyId) {
      setErrorMsg('Please select a customer or supplier.');
      return;
    }
    if (items.some((it) => !it.description?.trim())) {
      setErrorMsg('All line items must have a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveInvoice(
        {
          business_id: selectedBusiness?.id,
          party_id: selectedPartyId,
          invoice_number: invoiceNumber.trim(),
          invoice_type: invoiceType,
          invoice_date: invoiceDate,
          due_date: dueDate,
          financial_year: selectedBusiness?.financial_year || '2024-2025',
          place_of_supply: placeOfSupply,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          taxable_amount: totals.taxableAmount,
          cgst_amount: totals.cgstAmount,
          sgst_amount: totals.sgstAmount,
          igst_amount: totals.igstAmount,
          cess_amount: totals.cessAmount,
          total_amount: totals.totalAmount,
          amount_paid: 0,
          payment_status: status,
          notes: notes.trim() || null,
          document_path: attachment ? encodeAttachment(attachment) : null,
        },
        totals.calculatedItems
      );

      if (result.success) {
        router.push('/invoices');
      } else {
        setErrorMsg(result.error || 'Failed to save invoice.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateParty = async () => {
    if (!newPartyName.trim()) return;
    setIsSavingParty(true);
    try {
      const res = await saveParty({
        business_id: selectedBusiness?.id,
        party_name: newPartyName.trim(),
        party_type: newPartyType,
        state: newPartyState,
        gstin: newPartyGstin.trim() || null,
      });
      if (res.success && res.data) {
        setParties((prev) => [res.data!, ...prev]);
        setSelectedPartyId(res.data.id);
        setPlaceOfSupply(res.data.state);
        setIsPartyModalOpen(false);
        setNewPartyName('');
        setNewPartyGstin('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingParty(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/invoices" className="hover:text-blue-600 flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">New Invoice</span>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Invoice</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate compliant GST sales or purchase invoices with automatic tax classification
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveInvoice('draft')}
              isLoading={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSaveInvoice('unpaid')}
              isLoading={isSubmitting}
            >
              Finalize Invoice
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Invoice Primary Details Card */}
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Invoice Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Type</label>
              <select
                value={invoiceType}
                onChange={(e: any) => setInvoiceType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="sales">Sales Invoice (Outward)</option>
                <option value="purchase">Purchase Bill (Inward)</option>
              </select>
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. INV-2024-001"
              />
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Party Selector */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {invoiceType === 'sales' ? 'Customer' : 'Supplier / Vendor'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsPartyModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  + Add New
                </button>
              </div>
              <select
                value={selectedPartyId}
                onChange={(e) => handlePartyChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.party_name} ({p.state} {p.gstin ? `• ${p.gstin}` : '• Unregistered'})
                  </option>
                ))}
              </select>
            </div>

            {/* Place of Supply */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Place of Supply</label>
                <span className={`text-[11px] font-bold ${intra ? 'text-blue-600' : 'text-purple-600'}`}>
                  {intra ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                </span>
              </div>
              <select
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Invoice Document & Attachments Section */}
        <Card className="p-5">
          <InvoiceAttachmentUpload
            attachment={attachment}
            onAttachmentChange={setAttachment}
            businessId={selectedBusiness?.id}
            invoiceNumber={invoiceNumber}
            disabled={isSubmitting}
          />
        </Card>

        {/* Line Items Card */}
        <Card className="overflow-hidden">
          <CardHeader
            title="Line Items & GST Slabs"
            subtitle="Authoritative calculation with automatic rate split"
            action={
              <Button size="sm" variant="outline" onClick={handleAddItem} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Line Item
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-600">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">Item Description</th>
                  <th className="px-3 py-3 w-28">HSN/SAC</th>
                  <th className="px-3 py-3 w-20 text-right">Qty</th>
                  <th className="px-3 py-3 w-28 text-right">Unit Price</th>
                  <th className="px-3 py-3 w-24 text-right">Discount</th>
                  <th className="px-3 py-3 w-24 text-center">GST Rate</th>
                  <th className="px-4 py-3 w-32 text-right">Taxable</th>
                  <th className="px-4 py-3 w-32 text-right">Total (Inc. Tax)</th>
                  <th className="px-3 py-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const calc = totals.calculatedItems[idx] || {};
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Item name / service specification"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="e.g. 998313"
                          value={item.hsn_sac_code || ''}
                          onChange={(e) => handleItemChange(idx, 'hsn_sac_code', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price || ''}
                          onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount_amount || ''}
                          onChange={(e) => handleItemChange(idx, 'discount_amount', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={item.gst_rate ?? 18}
                          onChange={(e) => handleItemChange(idx, 'gst_rate', parseFloat(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {STANDARD_GST_RATES.map((r) => (
                            <option key={r} value={r}>
                              {r}%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-slate-800">
                        {formatINR(calc.taxable_amount || 0)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(calc.total_amount || 0)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Invoice Summary and Tax Reconciliation Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Notes & Payment Instructions
            </h3>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter bank transfer instructions, terms of payment, or reference numbers..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              Tax invoice generated in compliance with the Central Goods and Services Tax Act, 2017.
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-3">
              Tax Summary & Total (INR)
            </h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal (Gross Value):</span>
                <span className="font-mono">{formatINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Total Discounts Applied:</span>
                <span className="font-mono text-emerald-600">- {formatINR(totals.discountAmount)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold text-slate-800">
                <span>Net Taxable Value:</span>
                <span className="font-mono">{formatINR(totals.taxableAmount)}</span>
              </div>

              {intra ? (
                <>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono">{formatINR(totals.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>State GST (SGST):</span>
                    <span className="font-mono">{formatINR(totals.sgstAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono">{formatINR(totals.igstAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 text-slate-600">
                <span>Compensation Cess:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cessAmount || ''}
                  onChange={(e) => setCessAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-right font-mono text-xs"
                />
              </div>

              <div className="flex justify-between py-2 text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total (INR):</span>
                <span className="text-blue-600 font-mono">{formatINR(totals.totalAmount)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveInvoice('draft')}
                isLoading={isSubmitting}
              >
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveInvoice('unpaid')}
                isLoading={isSubmitting}
              >
                Finalize & Save
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Party Add Modal */}
        <Modal
          isOpen={isPartyModalOpen}
          onClose={() => setIsPartyModalOpen(false)}
          title="Add Customer / Supplier"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsPartyModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateParty} isLoading={isSavingParty}>
                Save Party
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Party Name</label>
              <input
                type="text"
                placeholder="Business / Client Name"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Party Type</label>
              <select
                value={newPartyType}
                onChange={(e: any) => setNewPartyType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="customer">Customer</option>
                <option value="supplier">Supplier / Vendor</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <select
                value={newPartyState}
                onChange={(e) => setNewPartyState(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 33AABCD1234E1Z5"
                value={newPartyGstin}
                onChange={(e) => setNewPartyGstin(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
