import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in cents to display format
 */
export function formatPriceCents(priceCents: number | null | undefined): string {
  if (priceCents == null) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(priceCents / 100);
}

/**
 * Parse price string to cents
 */
export function parsePriceToCents(priceString: string): number {
  const cleanedPrice = priceString.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanedPrice);
  return Math.round(price * 100);
}

/**
 * Format delivery time
 */
export function formatDeliveryTime(days: number | null | undefined): string {
  if (days == null) return 'N/A';
  
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return weeks === 1 ? '1 week' : `${weeks} weeks`;
    }
    return `${weeks}w ${remainingDays}d`;
  }
  
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  if (remainingDays === 0) {
    return months === 1 ? '1 month' : `${months} months`;
  }
  return `${months}m ${remainingDays}d`;
}

/**
 * Calculate days between dates
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
}

/**
 * Get deadline urgency status
 */
export function getDeadlineUrgency(deadline: Date): {
  status: 'expired' | 'urgent' | 'soon' | 'normal';
  daysRemaining: number;
  color: string;
} {
  const now = new Date();
  const daysRemaining = daysBetween(now, deadline);
  
  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining: Math.abs(daysRemaining),
      color: 'text-red-600 bg-red-50',
    };
  }
  
  if (daysRemaining <= 2) {
    return {
      status: 'urgent',
      daysRemaining,
      color: 'text-red-600 bg-red-50',
    };
  }
  
  if (daysRemaining <= 7) {
    return {
      status: 'soon',
      daysRemaining,
      color: 'text-yellow-600 bg-yellow-50',
    };
  }
  
  return {
    status: 'normal',
    daysRemaining,
    color: 'text-green-600 bg-green-50',
  };
}

/**
 * Format quote request status
 */
export function formatQuoteRequestStatus(status: string): {
  label: string;
  color: string;
} {
  switch (status.toLowerCase()) {
    case 'draft':
      return {
        label: 'Draft',
        color: 'text-gray-600 bg-gray-100',
      };
    case 'sent':
      return {
        label: 'Sent',
        color: 'text-blue-600 bg-blue-100',
      };
    case 'expired':
      return {
        label: 'Expired',
        color: 'text-red-600 bg-red-100',
      };
    case 'completed':
      return {
        label: 'Completed',
        color: 'text-green-600 bg-green-100',
      };
    default:
      return {
        label: status,
        color: 'text-gray-600 bg-gray-100',
      };
  }
}

/**
 * Format supplier response status
 */
export function formatSupplierResponseStatus(status: string): {
  label: string;
  color: string;
} {
  switch (status.toLowerCase()) {
    case 'pending':
      return {
        label: 'Pending',
        color: 'text-yellow-600 bg-yellow-100',
      };
    case 'submitted':
      return {
        label: 'Submitted',
        color: 'text-green-600 bg-green-100',
      };
    case 'declined':
      return {
        label: 'Declined',
        color: 'text-red-600 bg-red-100',
      };
    case 'expired':
      return {
        label: 'Expired',
        color: 'text-gray-600 bg-gray-100',
      };
    default:
      return {
        label: status,
        color: 'text-gray-600 bg-gray-100',
      };
  }
}

/**
 * Generate a short ID for display
 */
export function generateShortId(fullId: string, length: number = 8): string {
  return fullId.substring(0, length).toUpperCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate file download name
 */
export function generateDownloadFileName(
  type: 'quote-request' | 'responses' | 'analysis',
  title: string,
  format: 'pdf' | 'csv' | 'xlsx'
): string {
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const timestamp = new Date().toISOString().split('T')[0];
  
  return `${type}-${sanitizedTitle}-${timestamp}.${format}`;
}

/**
 * Create export data structure
 */
export function createExportData(
  headers: string[],
  rows: any[][],
  title?: string
): {
  headers: string[];
  rows: any[][];
  title?: string;
  timestamp: string;
} {
  return {
    headers,
    rows,
    title,
    timestamp: new Date().toISOString(),
  };
}