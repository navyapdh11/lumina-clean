/**
 * LuminaClean v5.0 - CRO API Routes
 * Handles MCTS optimization, variant deployment, and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMCTS } from '@/lib/cro/engine/mcts';
import { runToTAnalysis } from '@/lib/cro/agents/recommender';
import { validateABN, validatePostcode, calculateGST } from '@/lib/validation/cro';

// In-memory store (replace with Redis/DB in production)
const experiments = new Map();
const deployments = new Map();

// === POST /api/cro/optimize — Run MCTS + ToT optimization ===
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { region, currentCR, sessions, conversions, avgOrderValue } = body;

    // Validation
    if (!region || !currentCR) {
      return NextResponse.json({ error: 'region and currentCR are required' }, { status: 400 });
    }

    if (!validatePostcode(region)) {
      return NextResponse.json({ error: `Invalid region: ${region}. Valid: NSW, VIC, QLD, WA, SA, TAS, ACT, NT` }, { status: 400 });
    }

    // Variant IDs to test
    const variantIds = [
      'cta_blue', 'cta_green', 'trust_badges', 'form_simplified',
      'pricing_dynamic', 'layout_mobile', 'urgency_banner',
      'ar_hero', 'reviews_widget', 'calculator',
    ];

    // Run MCTS
    const mctsResults = runMCTS({
      region,
      currentCR: currentCR || 0.03,
      sessions: sessions || 3000,
      conversions: conversions || 90,
      avgOrderValue: avgOrderValue || 250,
    }, variantIds);

    // Run ToT analysis
    const totResults = runToTAnalysis(region, {
      mobileCR: currentCR * 0.6,
      desktopCR: currentCR * 1.3,
      bounceRate: 0.45,
    });

    // Store experiment
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
  } catch (error: any) {
    return NextResponse.json({ error: 'Optimization failed', details: error.message }, { status: 500 });
  }
}

// === GET /api/cro/optimize — Get experiment results ===
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const experimentId = searchParams.get('id');

  if (experimentId) {
    const exp = experiments.get(experimentId);
    if (!exp) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }
    return NextResponse.json(exp);
  }

  // Return all experiments
  return NextResponse.json({
    experiments: Array.from(experiments.values()),
    count: experiments.size,
  });
}
