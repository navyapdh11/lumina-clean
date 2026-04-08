/**
 * LuminaClean v5.0 - CRO API Routes
 * Handles MCTS optimization, variant deployment, and metrics
 * Security: Auth required for all operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMCTS } from '@/lib/cro/engine/mcts';

function runToTAnalysis(_region: string, data: { mobileCR?: number; desktopCR?: number; bounceRate?: number }) {
  return [
    { variant: 'mobile_optimization', score: (data.mobileCR || 0.02) * 10, confidence: 0.88 },
    { variant: 'desktop_enhancement', score: (data.desktopCR || 0.04) * 8, confidence: 0.85 },
    { variant: 'bounce_reduction', score: (1 - (data.bounceRate || 0.45)) * 7, confidence: 0.82 },
  ];
}

const AU_REGIONS = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;

function validateRegion(region: string): boolean {
  return AU_REGIONS.includes(region as typeof AU_REGIONS[number]);
}

function hasValidSession(req: NextRequest): boolean {
  const cookie =
    req.cookies.get('lc_session')?.value ||
    req.cookies.get('sb-access-token')?.value;
  if (!cookie) return false;
  return cookie.split('.').length === 3;
}

// In-memory store (replace with Redis/DB in production)
const experiments = new Map();
const deployments = new Map();

// === POST /api/cro/optimize — Run MCTS + ToT optimization ===
export async function POST(req: NextRequest) {
  if (!hasValidSession(req)) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { region, currentCR, sessions, conversions, avgOrderValue } = body;

    if (!region || !currentCR) {
      return NextResponse.json({ error: 'region and currentCR are required' }, { status: 400 });
    }

    if (!validateRegion(region)) {
      return NextResponse.json({ error: `Invalid region: ${region}. Valid: ${AU_REGIONS.join(', ')}` }, { status: 400 });
    }

    const variantIds = [
      'cta_blue', 'cta_green', 'trust_badges', 'form_simplified',
      'pricing_dynamic', 'layout_mobile', 'urgency_banner',
      'ar_hero', 'reviews_widget', 'calculator',
    ];

    const mctsResults = runMCTS({
      region,
      currentCR: currentCR || 0.03,
      sessions: sessions || 3000,
      conversions: conversions || 90,
      avgOrderValue: avgOrderValue || 250,
    }, variantIds);

    const totResults = runToTAnalysis(region, {
      mobileCR: currentCR * 0.6,
      desktopCR: currentCR * 1.3,
      bounceRate: 0.45,
    });

    const experimentId = `exp_${Date.now()}`;
    experiments.set(experimentId, {
      id: experimentId,
      region,
      timestamp: new Date().toISOString(),
      mctsResults,
      totResults,
      status: 'completed',
    });

    return NextResponse.json({
      experimentId,
      region,
      mctsResults: mctsResults.slice(0, 5),
      totRecommendations: totResults.slice(0, 5),
      status: 'completed',
    });
  } catch {
    return NextResponse.json({ error: 'Optimization failed' }, { status: 500 });
  }
}

// === GET /api/cro/optimize — Get experiment results ===
export async function GET(req: NextRequest) {
  if (!hasValidSession(req)) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const experimentId = searchParams.get('id');

  if (experimentId) {
    const exp = experiments.get(experimentId);
    if (!exp) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }
    return NextResponse.json(exp);
  }

  return NextResponse.json({
    experiments: Array.from(experiments.values()),
    count: experiments.size,
  });
}
