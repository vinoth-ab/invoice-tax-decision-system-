'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useBusiness } from '@/lib/context/BusinessContext';
import { fetchParties, saveParty } from '@/lib/data/store';
import { INDIAN_STATES } from '@/lib/calculations/gst';
import { Party, PartyType } from '@/types/database';
import {
  Users2,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building,
} from 'lucide-react';

export default function PartiesPage() {
  const { selectedBusiness } = useBusiness();
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyType, setPartyType] = useState<PartyType>('customer');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [gstin, setGstin] = useState('');

  const loadParties = async () => {
    if (!selectedBusiness) return;
    setIsLoading(true);
    try {
      const data = await fetchParties(selectedBusiness.id);
      setParties(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, [selectedBusiness]);

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nameMatch = p.party_name.toLowerCase().includes(term);
        const gstinMatch = (p.gstin || '').toLowerCase().includes(term);
        const stateMatch = p.state.toLowerCase().includes(term);
        if (!nameMatch && !gstinMatch && !stateMatch) return false;
      }
      if (typeFilter !== 'all' && p.party_type !== typeFilter && p.party_type !== 'both') return false;
      return true;
    });
  }, [parties, searchTerm, typeFilter]);

  const handleCreateParty = async () => {
    if (!partyName.trim()) return;
    setIsSaving(true);
    try {
      await saveParty({
        business_id: selectedBusiness?.id,
        party_name: partyName.trim(),
        party_type: partyType,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        state,
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : null,
      });

      await loadParties();
      setIsAddModalOpen(false);
      setPartyName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setGstin('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Users2 className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers & Suppliers</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Maintain directory of client accounts, vendor partners, place of supply states, and GSTIN identifiers
            </p>
          </div>

          <Button
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Customer / Supplier
          </Button>
        </div>

        {/* Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search party name, GSTIN, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Parties ({parties.length})</option>
                <option value="customer">Customers Only</option>
                <option value="supplier">Suppliers Only</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Parties Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Party Name</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">GSTIN</th>
                  <th className="px-4 py-3.5">State & Location</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5 text-center">Dataset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {p.party_name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`capitalize font-semibold text-[11px] px-2 py-0.5 rounded ${
                          p.party_type === 'customer'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {p.party_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-800">
                      {p.gstin || <span className="text-slate-400 italic">Unregistered (URP)</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900">{p.state}</p>
                      {p.address && <p className="text-[11px] text-slate-400 truncate max-w-xs">{p.address}</p>}
                    </td>
                    <td className="px-4 py-3.5 space-y-0.5 text-[11px] text-slate-500">
                      {p.email && (
                        <p className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                        </p>
                      )}
                      {p.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {p.phone}
                        </p>
                      )}
                      {!p.email && !p.phone && <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {p.is_sample ? (
                        <Badge variant="warning">Sample Demo</Badge>
                      ) : (
                        <Badge variant="success">User Record</Badge>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredParties.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      No customer or supplier records match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Party Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Customer / Supplier Party"
          description="Register a new commercial trading party"
          maxWidth="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateParty} isLoading={isSaving}>
                Save Party
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Party / Business Name *</label>
              <input
                type="text"
                placeholder="e.g. Apex Logistics Private Limited"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Party Role</label>
                <select
                  value={partyType}
                  onChange={(e: any) => setPartyType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="customer">Customer (Debtor)</option>
                  <option value="supplier">Supplier (Creditor)</option>
                  <option value="both">Both (Customer & Supplier)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State (Place of Supply)</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 33AAACV9876K1Z1"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono uppercase text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="billing@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 98400 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address</label>
              <textarea
                rows={2}
                placeholder="Street address, city, pincode..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
              />
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
