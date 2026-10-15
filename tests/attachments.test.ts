import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  getFileCategory,
  encodeAttachment,
  parseAttachment,
  InvoiceAttachmentMetadata,
} from '../lib/storage/attachments';

describe('Invoice Attachment & Storage Utilities', () => {
  it('formats raw file bytes into human-readable sizes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(5242880)).toBe('5 MB');
  });

  it('categorizes various file extensions into appropriate UI types', () => {
    // Images
    expect(getFileCategory('image/png', 'bill.png')).toBe('image');
    expect(getFileCategory('image/jpeg', 'receipt.jpg')).toBe('image');
    expect(getFileCategory('image/webp', 'scan.webp')).toBe('image');

    // PDFs
    expect(getFileCategory('application/pdf', 'invoice.pdf')).toBe('pdf');

    // Spreadsheets
    expect(getFileCategory('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'tax_data.xlsx')).toBe('spreadsheet');
    expect(getFileCategory('text/csv', 'gstr1.csv')).toBe('spreadsheet');

    // Office Documents
    expect(getFileCategory('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'contract.docx')).toBe('document');
    expect(getFileCategory('text/plain', 'notes.txt')).toBe('document');

    // Archives
    expect(getFileCategory('application/zip', 'scans.zip')).toBe('archive');
    expect(getFileCategory('application/x-rar-compressed', 'bills.rar')).toBe('archive');

    // Other/unknown
    expect(getFileCategory('application/octet-stream', 'binary.dat')).toBe('other');
  });

  it('encodes and parses attachment metadata faithfully', () => {
    const original: InvoiceAttachmentMetadata = {
      name: 'GST_Tax_Invoice_2024.pdf',
      size: 245000,
      type: 'application/pdf',
      url: 'https://vlpxhglwybbbgqysxryg.supabase.co/storage/v1/object/public/invoice-documents/inv.pdf',
      storagePath: 'b-1/inv-1/GST_Tax_Invoice_2024.pdf',
      uploadedAt: '2024-10-15T10:00:00.000Z',
    };

    const encoded = encodeAttachment(original);
    const parsed = parseAttachment(encoded);

    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe(original.name);
    expect(parsed?.size).toBe(original.size);
    expect(parsed?.type).toBe(original.type);
    expect(parsed?.url).toBe(original.url);
  });

  it('gracefully handles legacy raw URLs or null values in parseAttachment', () => {
    expect(parseAttachment(null)).toBeNull();
    expect(parseAttachment(undefined)).toBeNull();
    expect(parseAttachment('')).toBeNull();
    expect(parseAttachment('   ')).toBeNull();

    // Legacy plain string path
    const legacyPath = 'https://example.com/storage/invoice_123.pdf';
    const parsedLegacy = parseAttachment(legacyPath);
    expect(parsedLegacy).not.toBeNull();
    expect(parsedLegacy?.name).toBe('invoice_123.pdf');
    expect(parsedLegacy?.url).toBe(legacyPath);
  });
});
