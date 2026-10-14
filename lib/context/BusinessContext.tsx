'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Business } from '@/types/database';
import { useRouter } from 'next/navigation';

interface BusinessContextType {
  user: any | null;
  businesses: Business[];
  selectedBusiness: Business | null;
  isLoading: boolean;
  isDemoActive: boolean;
  setSelectedBusinessId: (id: string) => void;
  refreshBusinesses: () => Promise<void>;
  signOut: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

// Standalone fallback demo business if database has not yet been seeded
export const FALLBACK_DEMO_BUSINESS: Business = {
  id: 'b0000000-0000-0000-0000-000000000001',
  owner_id: null,
  business_name: 'DemoTech Solutions Private Limited',
  business_type: 'Private Limited Company',
  industry: 'Information Technology',
  address: 'Module 102, TIDEL Park, 4 Rajiv Gandhi Salai, Taramani',
  district: 'Chennai',
  state: 'Tamil Nadu',
  financial_year: '2024-2025',
  gst_registered: true,
  gstin: '33AABCD1234E1Z5',
  startup_recognized: true,
  annual_turnover: 45000000.00,
  is_demo: true,
  created_at: '2024-04-01T09:00:00Z',
  updated_at: '2024-04-01T09:00:00Z',
};

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchBusinesses = useCallback(async (currentUser: any) => {
    setIsLoading(true);
    try {
      // Query businesses: user-owned OR demo businesses
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('is_demo', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching businesses from Supabase (falling back to demo):', error.message);
        setBusinesses([FALLBACK_DEMO_BUSINESS]);
        setSelectedBusiness(FALLBACK_DEMO_BUSINESS);
      } else if (data && data.length > 0) {
        setBusinesses(data);
        // Persist previous selection if available
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('selected_business_id') : null;
        const matched = data.find((b) => b.id === savedId) || data[0];
        setSelectedBusiness(matched);
      } else {
        // Fallback to sample demo business
        setBusinesses([FALLBACK_DEMO_BUSINESS]);
        setSelectedBusiness(FALLBACK_DEMO_BUSINESS);
      }
    } catch (err) {
      console.error('Unexpected error fetching businesses:', err);
      setBusinesses([FALLBACK_DEMO_BUSINESS]);
      setSelectedBusiness(FALLBACK_DEMO_BUSINESS);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Check active auth session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      fetchBusinesses(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      fetchBusinesses(u);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchBusinesses]);

  const handleSelectBusinessId = (id: string) => {
    const found = businesses.find((b) => b.id === id);
    if (found) {
      setSelectedBusiness(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('selected_business_id', id);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <BusinessContext.Provider
      value={{
        user,
        businesses,
        selectedBusiness,
        isLoading,
        isDemoActive: !!selectedBusiness?.is_demo,
        setSelectedBusinessId: handleSelectBusinessId,
        refreshBusinesses: () => fetchBusinesses(user),
        signOut,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
