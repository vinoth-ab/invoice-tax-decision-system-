-- ==============================================================================
-- Migration: 002_storage_setup.sql
-- Description: Private Supabase Storage bucket for invoice PDF/image documents
-- with secure RLS policies.
-- ==============================================================================

-- Create private bucket 'invoice-documents' if it does not exist (allows all document/image formats up to 15MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'invoice-documents',
    'invoice-documents',
    false,
    15728640, -- 15MB file limit
    NULL -- NULL allows all formats (PDF, PNG, JPG, WEBP, DOCX, XLSX, CSV, ZIP, etc.)
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 15728640,
    allowed_mime_types = NULL;

-- Storage RLS Policies:
-- Storage objects path convention: {business_id}/{invoice_id}/{filename}

DROP POLICY IF EXISTS "Authenticated users can upload invoice documents" ON storage.objects;
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

DROP POLICY IF EXISTS "Users can view invoice documents for their businesses" ON storage.objects;
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

DROP POLICY IF EXISTS "Users can delete invoice documents for their businesses" ON storage.objects;
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
