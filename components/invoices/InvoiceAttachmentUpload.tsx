'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Archive,
  File as GenericFile,
  UploadCloud,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  InvoiceAttachmentMetadata,
  formatFileSize,
  getFileCategory,
  processFileAttachment,
} from '@/lib/storage/attachments';

interface InvoiceAttachmentUploadProps {
  attachment: InvoiceAttachmentMetadata | null;
  onAttachmentChange: (attachment: InvoiceAttachmentMetadata | null) => void;
  businessId?: string;
  invoiceNumber?: string;
  disabled?: boolean;
}

export function InvoiceAttachmentUpload({
  attachment,
  onAttachmentChange,
  businessId,
  invoiceNumber,
  disabled = false,
}: InvoiceAttachmentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

  const handleFileSelection = async (file: File) => {
    setErrorMessage(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds 15MB limit (${formatFileSize(file.size)}). Please choose a smaller file.`);
      return;
    }

    setIsProcessing(true);
    try {
      const metadata = await processFileAttachment(file, businessId, invoiceNumber);
      onAttachmentChange(metadata);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process file attachment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isDragging) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
      // Reset input value so same file name can be picked again if desired
      e.target.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAttachmentChange(null);
    setErrorMessage(null);
  };

  const getCategoryDetails = (cat: ReturnType<typeof getFileCategory>) => {
    switch (cat) {
      case 'image':
        return {
          icon: <ImageIcon className="w-5 h-5 text-blue-600" />,
          badgeVariant: 'default' as const,
          label: 'Image Document',
        };
      case 'pdf':
        return {
          icon: <FileText className="w-5 h-5 text-rose-600" />,
          badgeVariant: 'danger' as const,
          label: 'PDF Document',
        };
      case 'spreadsheet':
        return {
          icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
          badgeVariant: 'success' as const,
          label: 'Spreadsheet / Data',
        };
      case 'document':
        return {
          icon: <FileText className="w-5 h-5 text-indigo-600" />,
          badgeVariant: 'purple' as const,
          label: 'Text / Office Document',
        };
      case 'archive':
        return {
          icon: <Archive className="w-5 h-5 text-amber-600" />,
          badgeVariant: 'warning' as const,
          label: 'Archive Package',
        };
      default:
        return {
          icon: <GenericFile className="w-5 h-5 text-slate-600" />,
          badgeVariant: 'neutral' as const,
          label: 'Attachment File',
        };
    }
  };

  const category = attachment ? getFileCategory(attachment.type, attachment.name) : 'other';
  const categoryInfo = getCategoryDetails(category);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block font-semibold text-slate-800 text-xs">
            Invoice Document & Supporting Attachments
          </label>
          <span className="text-[11px] text-slate-500">
            Upload scans, invoices, purchase bills, or receipts in any format (PDF, PNG, JPG, WEBP, DOCX, XLSX, CSV, ZIP, etc. up to 15MB)
          </span>
        </div>
        {attachment && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> File Attached
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        onChange={onInputChange}
        disabled={disabled || isProcessing}
        className="hidden"
      />

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* If No Attachment is currently selected */}
      {!attachment && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
          } ${disabled || isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <div className="py-4 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-700">Processing & attaching file...</p>
              <p className="text-[11px] text-slate-400">Encoding document for secure association</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1 shadow-xs border border-blue-100">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  <span className="text-blue-600 hover:underline">Click to browse</span> or drag and drop invoice file here
                </p>
                <p className="text-[11px] text-slate-500">
                  Accepts all formats: Images (PNG, JPG, WEBP), PDFs, Excel/Spreadsheets, Word documents, & more
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">PDF</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">PNG</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">JPG</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">WEBP</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">XLSX</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">DOCX</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">CSV</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">ZIP</span>
                <span>• Max 15MB</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* If an Attachment IS selected */}
      {attachment && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* File Info Block */}
            <div className="flex items-start gap-3 min-w-0">
              {/* Thumbnail or File Icon */}
              {category === 'image' && attachment.url ? (
                <div
                  onClick={() => setPreviewOpen(true)}
                  className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0 cursor-pointer group relative shadow-xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  {categoryInfo.icon}
                </div>
              )}

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-xs text-slate-900 truncate max-w-xs sm:max-w-md" title={attachment.name}>
                    {attachment.name}
                  </p>
                  <Badge variant={categoryInfo.badgeVariant} className="text-[10px] py-0 px-1.5">
                    {categoryInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Size: <strong>{formatFileSize(attachment.size)}</strong></span>
                  <span>•</span>
                  <span>Type: <code className="text-slate-600">{attachment.type || 'binary'}</code></span>
                </div>
              </div>
            </div>

            {/* Actions Block */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {attachment.url && (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={category !== 'image' ? attachment.name : undefined}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View / Open</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isProcessing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                title="Choose a different file"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isProcessing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewOpen && category === 'image' && attachment?.url && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200">
              <span className="font-semibold text-xs text-slate-800 truncate">{attachment.name}</span>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-auto max-h-[80vh] flex items-center justify-center bg-slate-900/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
