/**
 * LuminaClean v5.0 - Four-Phase AutoDream (REM-Sleep Memory Consolidation)
 * The 24/7 AI coworker's "sleep phase" — consolidates observations into long-term memory
 * Pattern: mirrors autoDream.ts with cleaning-services adaptations
 */

interface DreamState {
  sessionId: string;
  lastConsolidatedAt: Date;
  observations: Observation[];
  facts: Fact[];
}

interface Observation {
  timestamp: Date;
  type: 'booking' | 'dispatch' | 'pricing' | 'customer_feedback' | 'scraper_lead';
  data: Record<string, any>;
  confidence: number;
}

interface Fact {
  id: string;
  statement: string;
  confidence: number;
  sources: string[];
  lastUpdated: Date;
}

// === DUAL-GATE TRIGGER (Cheapest First) ===
const MIN_HOURS = 6;
const MIN_SESSIONS = 50;

function hoursSinceLastConsolidated(lastAt: Date): number {
  return (Date.now() - lastAt.getTime()) / (1000 * 60 * 60);
}

function sessionCountSinceLast(_lastAt: Date): number {
  // Query PostgreSQL for session count since lastAt
  return 0; // Placeholder — implement with your DB
}

function shouldTriggerAutoDream(state: DreamState): boolean {
  const hoursSince = hoursSinceLastConsolidated(state.lastConsolidatedAt);
  const sessionsSince = sessionCountSinceLast(state.lastConsolidatedAt);
  return (hoursSince >= MIN_HOURS) && (sessionsSince >= MIN_SESSIONS);
}

// === FOUR-PHASE REM CYCLE ===

export async function runFourPhaseAutoDream(state: DreamState): Promise<void> {
  const lockFile = '/tmp/lumina_consolidation.lock';

  if (!shouldTriggerAutoDream(state)) return;

  try {
    // Acquire advisory lock (prevent concurrent consolidation)
    await acquireAdvisoryLock(lockFile);

    // PHASE 1: PRUNE CONTRADICTIONS
    const phase1Result = await phase1PruneContradictions(state);
    appendToDailyLog('AUTODREAM_PHASE_1', phase1Result);

    // PHASE 2: MERGE OBSERVATIONS → FACTS
    const phase2Result = await phase2MergeObservations(state, phase1Result.prunedObservations);
    appendToDailyLog('AUTODREAM_PHASE_2', phase2Result);

    // PHASE 3: SUMMARIZE WITH CoT
    const phase3Result = await phase3SummarizeWithCoT(phase2Result.newFacts);
    appendToDailyLog('AUTODREAM_PHASE_3', { summary: phase3Result.summary });

    // PHASE 4: FORMAT COMPACT + REINJECT
    const phase4Result = await phase4FormatAndReinject(phase3Result);
    await reinjectCompactSummary(state.sessionId, phase4Result.compactSummary);

    // Update consolidation timestamp
    await updateLastConsolidatedAt(state.sessionId);

    console.log(`[AutoDream] Consolidation complete: ${phase2Result.newFacts.length} new facts`);
  } catch (error) {
    console.error('[AutoDream] Consolidation failed:', error);
    await rollbackLockMtime(lockFile);
  } finally {
    await releaseAdvisoryLock(lockFile);
  }
}

async function phase1PruneContradictions(state: DreamState): Promise<{ prunedObservations: Observation[] }> {
  // Find and remove contradictory observations, keeping higher confidence
  const pruned: Observation[] = [];
  const seen = new Map<string, Observation>();

  for (const obs of state.observations) {
    const key = `${obs.type}-${JSON.stringify(obs.data)}`;
    const existing = seen.get(key);
    if (!existing || obs.confidence > existing.confidence) {
      seen.set(key, obs);
    }
  }

  pruned.push(...seen.values());
  return { prunedObservations: pruned };
}

async function phase2MergeObservations(
  _state: DreamState,
  observations: Observation[]
): Promise<{ newFacts: Fact[] }> {
  // Cluster similar observations into durable facts
  const newFacts: Fact[] = [];
  const clusters = new Map<string, Observation[]>();

  for (const obs of observations) {
    const clusterKey = obs.type;
    if (!clusters.has(clusterKey)) clusters.set(clusterKey, []);
    clusters.get(clusterKey)!.push(obs);
  }

  for (const [type, obsGroup] of clusters) {
    if (obsGroup.length >= 3) {
      newFacts.push({
        id: `fact-${Date.now()}-${type}`,
        statement: `Observed ${obsGroup.length} ${type} events with avg confidence ${obsGroup.reduce((a, b) => a + b.confidence, 0) / obsGroup.length}`,
        confidence: obsGroup.reduce((a, b) => a + b.confidence, 0) / obsGroup.length,
        sources: obsGroup.map(o => o.type),
        lastUpdated: new Date(),
      });
    }
  }

  return { newFacts };
}

async function phase3SummarizeWithCoT(facts: Fact[]): Promise<{ summary: string; analysis: string }> {
  // Generate summary with reasoning traces (stripped in Phase 4)
  const analysis = facts.map(f => `<analysis>${f.statement} (confidence: ${f.confidence.toFixed(2)})</analysis>`).join('\n');
  const summary = facts.map(f => `- ${f.statement}`).join('\n');
  return { summary, analysis };
}

async function phase4FormatAndReinject(phase3Result: { summary: string }): Promise<{ compactSummary: string }> {
  // Strip all reasoning, keep only actionable facts
  const compactSummary = phase3Result.summary
    .split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, 20) // max 20 bullets
    .join('\n');

  return { compactSummary: `## UPDATED HEURISTICS (AutoDream ${new Date().toISOString().split('T')[0]})\n${compactSummary}` };
}

// === HELPER FUNCTIONS ===

function appendToDailyLog(_label: string, _data: any): void {
  // Append-only daily log (implement with file or DB)
  console.log(`[AutoDream Log] ${_label}`);
}

async function acquireAdvisoryLock(_lockFile: string): Promise<void> {
  // Use flock or PostgreSQL advisory lock
}

async function releaseAdvisoryLock(_lockFile: string): Promise<void> {}

async function rollbackLockMtime(_lockFile: string): Promise<void> {
  // Restore original mtime on failure
}

async function updateLastConsolidatedAt(_sessionId: string): Promise<void> {
  // Update PostgreSQL timestamp
}

async function reinjectCompactSummary(_sessionId: string, _summary: string): Promise<void> {
  // Append to system prompt for next tick loop
}

export { shouldTriggerAutoDream, hoursSinceLastConsolidated };
export default { runFourPhaseAutoDream, shouldTriggerAutoDream };
