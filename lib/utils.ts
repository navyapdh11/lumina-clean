// Enterprise utility functions for LuminaClean v5.0

// Input sanitization (XSS prevention)
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (Australian format)
export function isValidAustralianPhone(phone: string): boolean {
  const phoneRegex = /^(\+?61|0)[2-478][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Postcode validation
export function isValidPostcode(postcode: string): boolean {
  const postcodeRegex = /^\d{4}$/;
  return postcodeRegex.test(postcode);
}

// Currency formatting (AUD)
export function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Date formatting
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Generate unique ID
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Error boundary helper
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Performance monitoring
export class PerformanceTracker {
  private marks: Map<string, number>;

  constructor() {
    this.marks = new Map();
  }

  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.marks.delete(label);
    
    // Log if in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
}

// API response helper
export function apiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  meta?: Record<string, any>
) {
  return {
    success,
    data,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export default {
  sanitizeInput,
  isValidEmail,
  isValidAustralianPhone,
  isValidPostcode,
  formatAUD,
  formatDate,
  generateId,
  debounce,
  safeJSONParse,
  PerformanceTracker,
  apiResponse,
};
