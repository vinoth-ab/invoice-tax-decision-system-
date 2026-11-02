'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Business } from '@/types/database';
import { SAMPLE_BUSINESS } from '@/lib/data/sample-dataset';
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
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching businesses from Supabase (falling back to ₹20L demo):', error.message);
        setBusinesses([SAMPLE_BUSINESS]);
        setSelectedBusiness(SAMPLE_BUSINESS);
      } else if (data && data.length > 0) {
        setBusinesses(data);
        // Persist previous selection if available
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('selected_business_id') : null;
        const matched = data.find((b) => b.id === savedId) || data[0];
        setSelectedBusiness(matched);
      } else {
        setBusinesses([SAMPLE_BUSINESS]);
        setSelectedBusiness(SAMPLE_BUSINESS);
      }
    } catch (err) {
      console.error('Unexpected error fetching businesses:', err);
      setBusinesses([SAMPLE_BUSINESS]);
      setSelectedBusiness(SAMPLE_BUSINESS);
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
