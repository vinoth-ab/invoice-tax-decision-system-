// ==============================================================================
// Currency & Date Formatting Utilities (Indian Convention)
// ==============================================================================

/**
 * Format a number as Indian Rupees (INR) using Indian Numbering system (Lakhs, Crores)
 * e.g., 1234567.89 -> "₹12,34,567.89"
 */
export function formatINR(amount: number | null | undefined, showDecimals: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  const rounded = Math.round(amount * 100) / 100;
  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);

  const parts = absAmount.toFixed(showDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';

  // Apply Indian grouping: last 3 digits, then groups of 2 digits
  let result = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherDigits = integerPart.substring(0, integerPart.length - 3);
    const formattedOther = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${formattedOther},${lastThree}`;
  } else {
    result = integerPart;
  }

  return `${isNegative ? '-' : ''}₹${result}${decimalPart}`;
}

/**
 * Compact Indian currency representation (e.g. ₹4.50 Cr or ₹12.50 L)
 */
export function formatCompactINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  }
  return formatINR(amount, false);
}

/**
 * Format date string (YYYY-MM-DD) into Indian readable format (DD/MM/YYYY)
 */
export function formatIndianDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format date with month name (e.g. 15 Oct 2024)
 */
export function formatIndianDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
