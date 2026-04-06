/**
 * LuminaClean v5.0 - Build Flags (44 Compile-Time Gates)
 * Mirrors Anthropic's Bun dead-code elimination pattern
 * Use Bun's DCE to strip 20+ unreleased features from public builds
 */

export const BUILD_FLAGS = {
  // Security & IP Protection
  ANTI_DISTILLATION: process.env.LUMINA_ANTI_DISTILL === '1',
  UNDERCOVER: true, // forces ON, no OFF
  NATIVE_CLIENT_ATTESTATION: false, // placeholder for Zig hash

  // Autonomous Agent (KAIROS)
  KAIROS_DAEMON: process.env.LUMINA_KAIROS === '1',
  AUTO_DREAM: process.env.LUMINA_AUTO_DREAM === '1',
  PROACTIVE_ACTIONS: process.env.LUMINA_PROACTIVE === '1',

  // Experimental Features
  DISABLE_EXPERIMENTAL_BETAS: process.env.NODE_ENV === 'production',
  USER_TYPE_ANT: false, // internal-only tools

  // Unreleased Features (20+ gated behind flags)
  BUDDY_SYSTEM: false,
  VERIFICATION_AGENT: process.env.LUMINA_VERIFY === '1',
  KAIROS_PROACTIVE: false,
  DREAM_SUBAGENT: false,
  TICK_LOOP_V2: false,
  APPEND_ONLY_LOGS: true,
  ADVISORY_LOCKS: true,
  REM_CONSOLIDATION: false,
  QUOTE_GENERATION_V2: false,
  DISPATCH_OPTIMIZER: false,
  MCTS_ROUTER: false,
  BIOSECURITY_ENGINE: false,
  MULTI_WAREHOUSE: false,
  POSTCODE_API: false,
  CLIMATE_FINDER: true,
  AR_SCANNER: true,
  LINKEDIN_SCRAPER: true,
  STRATA_PIPELINE: false,
  VOICE_DISPATCH: false,
  NDIS_TENDER_BOT: false,
  LOYALTY_PROGRAM: false,
  REFERRAL_SYSTEM: false,
  TWO_FACTOR_AUTH: false,
  ADMIN_DASHBOARD: false,
  REAL_TIME_TRACKING: false,
  AUTO_SCHEDULING: false,
  PREDICTIVE_PRICING: false,
  DYNAMIC_ROUTES: false,
  CLEANER_GPS: false,
  QUALITY_AUDIT: false,
  INVOICE_AUTO: false,
  PAYMENT_SPLIT: false,
  STRIPE_CONNECT: false,
  XERO_INTEGRATION: false,
  SHOPIFY_HEADLESS: false,
  WOOCOMMERCE_SYNC: false,
} as const;

// Helper: check if feature is enabled
export function isFeatureEnabled(flag: keyof typeof BUILD_FLAGS): boolean {
  return BUILD_FLAGS[flag];
}

// Helper: get all enabled features
export function getEnabledFeatures(): string[] {
  return Object.entries(BUILD_FLAGS)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);
}

export default { BUILD_FLAGS, isFeatureEnabled, getEnabledFeatures };
