-- ==============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Core schema, tables, constraints, indexes, RLS policies, and triggers
-- for Integrated Invoice Analytics and Tax Optimization Decision Support System
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. BUSINESSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    industry TEXT NOT NULL,
    address TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    financial_year TEXT NOT NULL DEFAULT '2024-2025',
    gst_registered BOOLEAN NOT NULL DEFAULT false,
    gstin TEXT,
    startup_recognized BOOLEAN NOT NULL DEFAULT false,
    annual_turnover NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT positive_turnover CHECK (annual_turnover >= 0)
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own businesses or sample demo businesses"
    ON public.businesses FOR SELECT
    USING (owner_id = auth.uid() OR is_demo = true);

CREATE POLICY "Users can create their own businesses"
    ON public.businesses FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own businesses"
    ON public.businesses FOR UPDATE
    USING (owner_id = auth.uid() AND is_demo = false);

CREATE POLICY "Users can delete their own businesses"
    ON public.businesses FOR DELETE
    USING (owner_id = auth.uid() AND is_demo = false);

-- ------------------------------------------------------------------------------
-- 3. PARTIES TABLE (Customers and Suppliers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    party_name TEXT NOT NULL,
    party_type TEXT NOT NULL CHECK (party_type IN ('customer', 'supplier', 'both')),
    email TEXT,
    phone TEXT,
    address TEXT,
    state TEXT NOT NULL,
    gstin TEXT,
    is_sample BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_parties_business_id ON public.parties(business_id);
CREATE INDEX IF NOT EXISTS idx_parties_party_type ON public.parties(party_type);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view parties of accessible businesses"
    ON public.parties FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = parties.business_id
            AND (b.owner_id = auth.uid() OR b.is_demo = true)
        )
    );

CREATE POLICY "Users can insert parties into their businesses"
    ON public.parties FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = parties.business_id
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update parties in their businesses"
    ON public.parties FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = parties.business_id
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete parties in their businesses"
    ON public.parties FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = parties.business_id
            AND b.owner_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 4. INVOICES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    invoice_type TEXT NOT NULL CHECK (invoice_type IN ('sales', 'purchase')),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    financial_year TEXT NOT NULL,
    place_of_supply TEXT NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (taxable_amount >= 0),
    cgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (cgst_amount >= 0),
    sgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (sgst_amount >= 0),
    igst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (igst_amount >= 0),
    cess_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (cess_amount >= 0),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('draft', 'unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    document_path TEXT,
    is_sample BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_business_invoice_number UNIQUE (business_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_business_date ON public.invoices(business_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON public.invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_party ON public.invoices(party_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices of accessible businesses"
    ON public.invoices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = invoices.business_id
            AND (b.owner_id = auth.uid() OR b.is_demo = true)
        )
    );

CREATE POLICY "Users can insert invoices into their businesses"
    ON public.invoices FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = invoices.business_id
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update invoices in their businesses"
    ON public.invoices FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = invoices.business_id
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete invoices in their businesses"
    ON public.invoices FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = invoices.business_id
            AND b.owner_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 5. INVOICE_ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hsn_sac_code TEXT,
    quantity NUMERIC(12, 4) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00 CHECK (gst_rate >= 0),
    taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (taxable_amount >= 0),
    cgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (cgst_amount >= 0),
    sgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (sgst_amount >= 0),
    igst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (igst_amount >= 0),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view line items of accessible invoices"
    ON public.invoice_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices inv
            JOIN public.businesses b ON b.id = inv.business_id
            WHERE inv.id = invoice_items.invoice_id
            AND (b.owner_id = auth.uid() OR b.is_demo = true)
        )
    );

CREATE POLICY "Users can insert line items into their invoices"
    ON public.invoice_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices inv
            JOIN public.businesses b ON b.id = inv.business_id
            WHERE inv.id = invoice_items.invoice_id
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update line items of their invoices"
    ON public.invoice_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices inv
            JOIN public.businesses b ON b.id = inv.business_id
            WHERE inv.id = invoice_items.invoice_id
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete line items of their invoices"
    ON public.invoice_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices inv
            JOIN public.businesses b ON b.id = inv.business_id
            WHERE inv.id = invoice_items.invoice_id
            AND b.owner_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 6. TAX_SCHEMES TABLE (Reference Catalog)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_code TEXT NOT NULL UNIQUE,
    scheme_name TEXT NOT NULL,
    administering_authority TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('tax_deduction', 'presumptive_taxation', 'gst_composition', 'subsidy_grant', 'credit_guarantee', 'loan_scheme', 'registration_benefit')),
    description TEXT NOT NULL,
    applicable_business_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    eligibility_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    benefit_description TEXT NOT NULL,
    tax_regime TEXT,
    effective_from DATE,
    effective_to DATE,
    official_source_url TEXT NOT NULL,
    official_source_title TEXT NOT NULL,
    last_verified_at TIMESTAMPTZ,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'needs_verification', 'expired')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_sample BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tax_schemes_category ON public.tax_schemes(category);
CREATE INDEX IF NOT EXISTS idx_tax_schemes_active ON public.tax_schemes(is_active);

ALTER TABLE public.tax_schemes ENABLE ROW LEVEL SECURITY;

-- Reference data is readable by all authenticated users and anonymous visitors
CREATE POLICY "Tax schemes are viewable by all users"
    ON public.tax_schemes FOR SELECT
    USING (true);

-- Modifications restricted to trusted service role or admins
CREATE POLICY "Admins can insert tax schemes"
    ON public.tax_schemes FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can update tax schemes"
    ON public.tax_schemes FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "Admins can delete tax schemes"
    ON public.tax_schemes FOR DELETE
    USING (auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 7. TAX_ASSESSMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    financial_year TEXT NOT NULL,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    turnover_used NUMERIC(15, 2) NOT NULL,
    estimated_taxable_income NUMERIC(15, 2),
    potential_benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_tax_savings NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    assumptions JSONB NOT NULL DEFAULT '{}'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    disclaimer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tax_assessments_business ON public.tax_assessments(business_id);

ALTER TABLE public.tax_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tax assessments of accessible businesses"
    ON public.tax_assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = tax_assessments.business_id
            AND (b.owner_id = auth.uid() OR b.is_demo = true)
        )
    );

CREATE POLICY "Users can create tax assessments for their businesses"
    ON public.tax_assessments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = tax_assessments.business_id
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tax assessments for their businesses"
    ON public.tax_assessments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = tax_assessments.business_id
            AND b.owner_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 8. ANOMALY_ALERTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    description TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'dismissed', 'resolved')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_business ON public.anomaly_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_status ON public.anomaly_alerts(status);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_severity ON public.anomaly_alerts(severity);

ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view anomaly alerts of accessible businesses"
    ON public.anomaly_alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = anomaly_alerts.business_id
            AND (b.owner_id = auth.uid() OR b.is_demo = true)
        )
    );

CREATE POLICY "Users can create anomaly alerts in their businesses"
    ON public.anomaly_alerts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = anomaly_alerts.business_id
            AND (b.owner_id = auth.uid() OR b.is_demo = true)
        )
    );

CREATE POLICY "Users can update anomaly alerts in their businesses"
    ON public.anomaly_alerts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = anomaly_alerts.business_id
            AND (b.owner_id = auth.uid() OR b.is_demo = true)
        )
    );

-- ------------------------------------------------------------------------------
-- 9. INVOICE_FILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    upload_status TEXT NOT NULL CHECK (upload_status IN ('uploaded', 'processing', 'attached', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoice_files_business ON public.invoice_files(business_id);
CREATE INDEX IF NOT EXISTS idx_invoice_files_invoice ON public.invoice_files(invoice_id);

ALTER TABLE public.invoice_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files of accessible businesses"
    ON public.invoice_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = invoice_files.business_id
            AND (b.owner_id = auth.uid() OR b.is_demo = true)
        )
    );

CREATE POLICY "Users can insert files into their businesses"
    ON public.invoice_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = invoice_files.business_id
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete files in their businesses"
    ON public.invoice_files FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = invoice_files.business_id
            AND b.owner_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 10. AUTH TRIGGER FOR PROFILE CREATION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at auto-refresh triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_parties_updated_at ON public.parties;
CREATE TRIGGER update_parties_updated_at
    BEFORE UPDATE ON public.parties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tax_schemes_updated_at ON public.tax_schemes;
CREATE TRIGGER update_tax_schemes_updated_at
    BEFORE UPDATE ON public.tax_schemes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
