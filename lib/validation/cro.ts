/**
 * LuminaClean v5.0 - Enterprise Validation
 * ABN validation, GST calculation, compliance checks for Australian regions
 */

// Validate Australian Business Number (ABN)
export function validateABN(abn: string): boolean {
  if (!abn) return false;
  const cleaned = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(cleaned)) return false;

  // ABN validation algorithm
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    let digit = parseInt(cleaned[i]);
    if (i === 0) digit -= 1; // First digit adjustment
    sum += digit * weights[i];
  }

  return sum % 89 === 0;
}

// Validate Australian postcode
export function validatePostcode(postcode: string): boolean {
  if (!postcode) return false;
  const cleaned = postcode.trim();
  if (!/^\d{4}$/.test(cleaned)) return false;
  const code = parseInt(cleaned);
  return code >= 200 && code <= 9999;
}

// Get state from postcode
export function getStateFromPostcode(postcode: string): string | null {
  const code = parseInt(postcode);
  if (code >= 1000 && code <= 2599) return 'NSW';
  if (code >= 2619 && code <= 2899) return 'NSW';
  if (code >= 2921 && code <= 2999) return 'NSW';
  if (code >= 3000 && code <= 3999) return 'VIC';
  if (code >= 8000 && code <= 8999) return 'VIC';
  if (code >= 4000 && code <= 4999) return 'QLD';
  if (code >= 9000 && code <= 9999) return 'QLD';
  if (code >= 6000 && code <= 6799) return 'WA';
  if (code >= 5000 && code <= 5799) return 'SA';
  if (code >= 5900 && code <= 5999) return 'SA';
  if (code >= 7000 && code <= 7799) return 'TAS';
  if (code >= 200 && code <= 299) return 'ACT';
  if (code >= 2600 && code <= 2618) return 'ACT';
  if (code >= 900 && code <= 999) return 'NT';
  if (code >= 8000 && code <= 8099) return 'NT';
  return null;
}

// Calculate GST (10%)
export function calculateGST(amount: number): number {
  return Math.round((amount / 11) * 100) / 100; // GST = price / 11 for GST-inclusive
}

// Calculate price including GST
export function priceWithGST(exclusiveAmount: number): number {
  return Math.round(exclusiveAmount * 1.1 * 100) / 100;
}

// Validate service pricing (enterprise gate)
export function validateServicePricing(price: number, region: string): { valid: boolean; minPrice: number; maxPrice: number } {
  const priceRanges: Record<string, [number, number]> = {
    NSW: [99, 999],
    VIC: [89, 899],
    QLD: [79, 849],
    WA: [109, 1099],
    SA: [69, 799],
    TAS: [59, 699],
    ACT: [119, 1199],
    NT: [129, 1299],
  };
  const [min, max] = priceRanges[region] || [50, 1500];
  return { valid: price >= min && price <= max, minPrice: min, maxPrice: max };
}

// Compliance check for CRO deployment
export function checkCROCompliance(variant: { type: string; price?: number; region: string }): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check pricing compliance
  if (variant.price !== undefined) {
    const priceValidation = validateServicePricing(variant.price, variant.region);
    if (!priceValidation.valid) {
      issues.push(`Price $${variant.price} outside valid range for ${variant.region} ($${priceValidation.minPrice}-$${priceValidation.maxPrice})`);
    }
    // Check GST inclusion
    const gst = calculateGST(variant.price);
    if (gst < 0) {
      issues.push('Invalid price: negative GST calculation');
    }
  }

  // Check variant type compliance
  const allowedTypes = ['cta', 'layout', 'pricing', 'form', 'trust'];
  if (!allowedTypes.includes(variant.type)) {
    issues.push(`Invalid variant type: ${variant.type}. Allowed: ${allowedTypes.join(', ')}`);
  }

  return { compliant: issues.length === 0, issues };
}

// Enterprise gate: check if variant meets deployment threshold
export function checkDeploymentGate(confidence: number, sampleSize: number, minConfidence: number = 0.90, minSample: number = 100): { approved: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (confidence < minConfidence) {
    reasons.push(`Confidence ${(confidence * 100).toFixed(1)}% below ${minConfidence * 100}% threshold`);
  }
  if (sampleSize < minSample) {
    reasons.push(`Sample size ${sampleSize} below minimum ${minSample}`);
  }
  return { approved: reasons.length === 0, reasons };
}

export default {
  validateABN,
  validatePostcode,
  getStateFromPostcode,
  calculateGST,
  priceWithGST,
  validateServicePricing,
  checkCROCompliance,
  checkDeploymentGate,
};
