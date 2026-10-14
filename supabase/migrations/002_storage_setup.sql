-- ==============================================================================
-- Migration: 002_storage_setup.sql
-- Description: Private Supabase Storage bucket for invoice PDF/image documents
-- with secure RLS policies.
-- ==============================================================================

-- Create private bucket 'invoice-documents' if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'invoice-documents',
    'invoice-documents',
    false,
    10485760, -- 10MB file limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS Policies:
-- Storage objects path convention: {business_id}/{invoice_id}/{filename}

CREATE POLICY "Authenticated users can upload invoice documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'invoice-documents' AND
    EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id::text = (storage.foldername(name))[1]
        AND b.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can view invoice documents for their businesses"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'invoice-documents' AND
    EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id::text = (storage.foldername(name))[1]
        AND (b.owner_id = auth.uid() OR b.is_demo = true)
    )
);

CREATE POLICY "Users can delete invoice documents for their businesses"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'invoice-documents' AND
    EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id::text = (storage.foldername(name))[1]
        AND b.owner_id = auth.uid()
    )
);
