// ==============================================================================
// Invoice Document OCR Extensibility Interface
// Clean modular abstraction allowing external OCR services (AWS Textract, Google Document AI,
// or Azure Form Recognizer) to be plugged in without disrupting manual invoice workflows.
// ==============================================================================

export interface ExtractedInvoiceData {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  partyName?: string;
  partyGstin?: string;
  subtotal?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount?: number;
  confidenceScore: number;
  rawText?: string;
  extractedLineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
}

export interface InvoiceOcrProvider {
  name: string;
  isConfigured(): boolean;
  extractInvoiceFromBuffer(fileBuffer: Buffer, mimeType: string): Promise<ExtractedInvoiceData | null>;
}

/**
 * Default fallback provider when no external OCR provider credentials are configured.
 * As required by specifications: does NOT pretend that OCR has extracted data when it has not.
 */
export class UnconfiguredOcrProvider implements InvoiceOcrProvider {
  name = 'Standard Manual Entry (No external OCR provider credentials configured)';

  isConfigured(): boolean {
    return false;
  }

  async extractInvoiceFromBuffer(): Promise<ExtractedInvoiceData | null> {
    // Explicitly return null with warning; user enters invoice details manually.
    return null;
  }
}

let activeProvider: InvoiceOcrProvider = new UnconfiguredOcrProvider();

export function getOcrProvider(): InvoiceOcrProvider {
  return activeProvider;
}

export function setOcrProvider(provider: InvoiceOcrProvider): void {
  activeProvider = provider;
}
