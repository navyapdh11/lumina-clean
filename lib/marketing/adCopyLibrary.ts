/**
 * LuminaClean v5.0 - High-Converting Ad Copy Library
 * Enterprise-grade ad creatives for Australia 2026 launch
 * Meta, Google Search, Email sequences
 */

export interface AdCreative {
  id: string;
  platform: 'meta' | 'google' | 'email';
  type: 'awareness' | 'conversion' | 'retargeting' | 'b2b';
  headline: string;
  body: string;
  cta: string;
  audience: string;
  budget?: string;
  expectedCTR?: string;
  expectedCPA?: string;
  expectedROAS?: string;
}

export const AD_COPY_LIBRARY: AdCreative[] = [
  // META ADS
  {
    id: 'meta-001',
    platform: 'meta',
    type: 'awareness',
    headline: "Is Your Cleaner Ready for Australia's 2026 Heatwave?",
    body: "45°C summers demand more than a standard clean. Our climate-smart packages include heat-resistant sanitisation (99.9% bacteria kill), dust-mite elimination, and AC vent deep-clean. Book in 60 seconds → Serving all 8 states • Fair Work compliant • 5,000+ 5-star reviews",
    cta: 'Get Quote',
    audience: 'Homeowners 30-55, NSW/VIC/QLD, interests: cleaning, home maintenance',
    budget: '$50/day',
    expectedCTR: '2.8%',
  },
  {
    id: 'meta-002',
    platform: 'meta',
    type: 'conversion',
    headline: "Reclaim 6 Hours This Weekend — We'll Clean While You Relax",
    body: "Your Saturday is worth more than $180. 3BR House Clean: $289 (was $365). Office Clean (100m²): $349. Strata Common Areas: From $199. First-time bonus: Free oven clean with any premium package.",
    cta: 'Book Now',
    audience: 'Dual-income families, Sydney/Melbourne/Brisbane, retargeting: website visitors 7 days',
    budget: '$80/day',
    expectedROAS: '4.2x',
  },
  {
    id: 'meta-003',
    platform: 'meta',
    type: 'retargeting',
    headline: "Last 3 Slots This Saturday in Your Area",
    body: "You viewed our Premium Clean — here's 15% off if you book in the next 4 hours: Premium Whole-House Clean, Was: $425 → Now: $361. Includes carpet steam, window wash, oven + fridge deep-clean.",
    cta: 'Claim Discount',
    audience: 'Cart abandoners 3 days, pricing page visitors',
    budget: '$40/day',
    expectedCTR: '8.3%',
  },
  {
    id: 'meta-004',
    platform: 'meta',
    type: 'b2b',
    headline: "Strata Managers: Cut Cleaning Costs by 23%",
    body: "Australian strata complexes overspend $4,200/yr on average. Dynamic scheduling, real-time quality audits, consolidated billing. Free strata audit → See your savings in 10 minutes. Trusted by 340+ strata managers.",
    cta: 'Book Audit',
    audience: 'Job titles: Strata Manager, Property Manager, Australia',
    budget: '$100/day',
    expectedCPA: '$89',
  },
  // GOOGLE SEARCH ADS
  {
    id: 'google-001',
    platform: 'google',
    type: 'conversion',
    headline: 'House Cleaning Sydney | From $189 | Book in 60 Seconds',
    body: 'Vetted, insured cleaners. Real-time tracking. Satisfaction guaranteed. Get instant quote by postcode. Fair Work compliant. Free re-clean within 24 hrs.',
    cta: 'Get Quote',
    audience: '"house cleaning near me" searchers, Sydney metro',
    expectedCTR: '6.2%',
  },
  {
    id: 'google-002',
    platform: 'google',
    type: 'conversion',
    headline: 'End of Lease Cleaning | Bond-Back Guarantee | From $299',
    body: '100% bond-back guarantee or we re-clean free. Carpet steam, window wash, oven, bathroom sanitisation. Book online in 90 seconds. Same-day quotes.',
    cta: 'Book Now',
    audience: '"end of lease cleaning" searchers, NSW/VIC/QLD',
    expectedCTR: '7.8%',
  },
  {
    id: 'google-003',
    platform: 'google',
    type: 'b2b',
    headline: 'Office Cleaning Melbourne | Custom Quotes | ISO 9001',
    body: 'Tailored cleaning plans for offices 50–5,000m². Real-time quality reporting. Fair Work Award wages. Free site inspection + quote in 24 hrs.',
    cta: 'Request Quote',
    audience: '"office cleaning services" B2B searchers, Melbourne',
    expectedCTR: '5.4%',
  },
];

// EMAIL SEQUENCES
export interface EmailSequence {
  id: string;
  trigger: string;
  day: number;
  subject: string;
  preview: string;
  body: string;
}

export const EMAIL_SEQUENCES: EmailSequence[] = [
  {
    id: 'email-welcome',
    trigger: 'signup',
    day: 0,
    subject: 'Welcome to LuminaClean — Here\'s 15% Off Your First Clean 🎉',
    preview: 'Your welcome discount is inside...',
    body: `Hi {{firstName}},\n\nThanks for joining 12,000+ Aussies who trust us.\n\nCode: WELCOME15 (expires in 7 days)\n\n✅ Vetted, insured cleaners\n✅ Real-time GPS tracking\n✅ Satisfaction guarantee\n✅ Fair Work Award wages\n\n👉 Get Your Instant Quote: [Postcode Lookup]\n\nThe LuminaClean Team`,
  },
  {
    id: 'email-cart',
    trigger: 'cart_abandoned',
    day: 1,
    subject: 'Your Clean Is Waiting — Complete Booking in 2 Minutes 🕒',
    preview: 'Your quote is reserved for 6 more hours...',
    body: "Hi {{firstName}},\n\nYou were so close! Your quote for {{serviceType}} at ${{quoteAmount}} is still reserved — but only for 6 hours.\n\n⭐ \"Best clean in 5 years of Sydney living!\" — Emma R.\n\nUse code SAVE10 for extra $10 off in the next 2 hours.\n\n👉 Complete Your Booking: [Resume Checkout]",
  },
  {
    id: 'email-review',
    trigger: 'service_completed',
    day: 2,
    subject: 'How Did We Do, {{firstName}}? 🌟',
    preview: '30-second review = chance to win FREE clean',
    body: `Hi {{firstName}},\n\nWe'd love your feedback — 30 seconds and you'll go into the draw to win a FREE premium clean ($425 value).\n\n👉 Leave a Review: [Star Rating]\n\nPlus, refer a neighbour and you BOTH get $20 credit.`,
  },
  {
    id: 'email-seasonal',
    trigger: 'seasonal',
    day: 0,
    subject: '🍂 Autumn Deep Clean Special — 25% Off Premium Packages',
    preview: 'Was $425 → Now $319. Ends April 30.',
    body: `Hi {{firstName}},\n\nPollen, dust, winter prep — your home needs more than a standard clean.\n\nPremium Deep Clean: Was $425 → Now $319\n✅ Carpet steam (98% allergen removal)\n✅ AC vent sanitisation (+47% air quality)\n✅ Oven + fridge deep-clean\n\n👉 Book Your Autumn Clean: [Instant Quote]\n\nOffer ends April 30, 2026.`,
  },
];

export default { AD_COPY_LIBRARY, EMAIL_SEQUENCES };
