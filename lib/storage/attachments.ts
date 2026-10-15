// ==============================================================================
// Invoice File Attachment & Storage Utility
// Supports all document and image formats: PDF, PNG, JPG, WEBP, DOCX, XLSX, CSV, etc.
// Integrates with Supabase Storage with local DataURL fallback for offline & demo modes.
// ==============================================================================

import { createClient } from '@/lib/supabase/client';

export interface InvoiceAttachmentMetadata {
  name: string;
  size: number;
  type: string;
  url: string;
  storagePath?: string;
  uploadedAt: string;
}

/**
 * Format raw byte size into human readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

/**
 * Categorize file format for UI display, icons, and styling
 */
export function getFileCategory(
  mimeType: string,
  filename: string
): 'image' | 'pdf' | 'spreadsheet' | 'document' | 'archive' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (
    mimeType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'tiff', 'heic'].includes(ext)
  ) {
    return 'image';
  }

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }

  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv' ||
    ['xlsx', 'xls', 'csv'].includes(ext)
  ) {
    return 'spreadsheet';
  }

  if (
    mimeType.includes('word') ||
    mimeType.includes('officedocument') ||
    mimeType.includes('text/plain') ||
    ['doc', 'docx', 'txt', 'rtf'].includes(ext)
  ) {
    return 'document';
  }

  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('tar') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'archive';
  }

  return 'other';
}

/**
 * Parse an invoice document_path string into structured metadata
 */
export function parseAttachment(
  documentPath: string | null | undefined
): InvoiceAttachmentMetadata | null {
  if (!documentPath || typeof documentPath !== 'string') return null;
  const trimmed = documentPath.trim();
  if (!trimmed) return null;

  // If saved as JSON string
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.name && parsed.url) {
        return parsed as InvoiceAttachmentMetadata;
      }
    } catch {
      // fallback to plain string
    }
  }

  // If saved as a plain file path or URL
  const filename = trimmed.split('/').pop() || 'invoice-document';
  return {
    name: filename,
    size: 0,
    type: 'application/octet-stream',
    url: trimmed,
    storagePath: trimmed,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Encode attachment metadata into a persistable string for invoices.document_path
 */
export function encodeAttachment(attachment: InvoiceAttachmentMetadata): string {
  return JSON.stringify(attachment);
}

/**
 * Process and upload file attachment:
 * 1. Reads file as DataURL for instant local preview and offline storage
 * 2. Attempts to upload to Supabase Storage bucket 'invoice-documents' if available
 * 3. Returns structured metadata with URL
 */
export async function processFileAttachment(
  file: File,
  businessId?: string,
  invoiceNumber?: string
): Promise<InvoiceAttachmentMetadata> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const now = new Date().toISOString();

  // Read as base64 data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  let fileUrl = dataUrl;
  let storagePath: string | undefined = undefined;

  // Attempt Supabase Storage upload
  try {
    const supabase = createClient();
    const folder = businessId || 'default';
    const subfolder = invoiceNumber ? invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_') : 'pending';
    const remotePath = `${folder}/${subfolder}/${timestamp}_${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from('invoice-documents')
      .upload(remotePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error && data?.path) {
      storagePath = data.path;
      // Get signed or public URL
      const { data: publicUrlData } = supabase.storage
        .from('invoice-documents')
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        fileUrl = publicUrlData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload bypassed, using local data URL fallback:', err);
  }

  return {
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    url: fileUrl,
    storagePath,
    uploadedAt: now,
  };
}
