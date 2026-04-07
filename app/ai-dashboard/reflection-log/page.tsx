'use client';

import { useState, useEffect } from 'react';

interface ReflectionEntry {
  id: string;
  timestamp: string;
  task: string;
  initialConfidence: number;
  finalConfidence: number;
  iterations: number;
  critiques: string[];
  status: 'complete' | 'in_progress' | 'failed';
  agent: string;
}

function generateReflectionLog(): ReflectionEntry[] {
  return [
    {
      id: 'rl-1047',
      timestamp: '2026-04-06T10:15:00Z',
      task: 'Improve booking form conversion rate',
      initialConfidence: 0.62,
      finalConfidence: 0.91,
      iterations: 3,
      critiques: [
        'Critique: Form has 8 steps — industry benchmark is 3-4. Each additional step drops conversion by ~12%.',
        'Refinement: Reduced to 4 steps: (1) Service type + region, (2) Date/time, (3) Contact info, (4) Confirm.',
        'Validation: A/B test simulation shows 48% improvement in completion rate. Confidence elevated to 0.91.',
      ],
      status: 'complete',
      agent: 'GoT Reasoner',
    },
    {
      id: 'rl-1046',
      timestamp: '2026-04-06T09:52:00Z',
      task: 'Optimize AR scanner UX flow',
      initialConfidence: 0.71,
      finalConfidence: 0.88,
      iterations: 2,
      critiques: [
        'Critique: AR scan button below fold on mobile — 67% of users never see it.',
        'Refinement: Moved AR CTA to hero section with prominent "Try AR Scanner" button. Added region auto-detect.',
      ],
      status: 'complete',
      agent: 'UX Analyzer',
    },
    {
      id: 'rl-1045',
      timestamp: '2026-04-06T09:30:00Z',
      task: 'Strata lead scoring model refinement',
      initialConfidence: 0.55,
      finalConfidence: 0.85,
      iterations: 4,
      critiques: [
        'Critique: Lead scoring based only on job title — misses engagement signals.',
        'Refinement: Added property count, company size, and recent activity as scoring factors.',
        'Critique 2: Weight distribution too uniform — property count should be 2x weight.',
        'Final: Adjusted weights — Property Count (40%), Company Size (25%), Activity (20%), Title (15%). Confidence: 0.85.',
      ],
      status: 'complete',
      agent: 'GoT Reasoner',
    },
    {
      id: 'rl-1044',
      timestamp: '2026-04-06T08:45:00Z',
      task: 'Regional pricing page redesign',
      initialConfidence: 0.68,
      finalConfidence: 0.93,
      iterations: 2,
      critiques: [
        'Critique: Pricing table shows all 8 states — overwhelms users. Should default to detected region.',
        'Refinement: Auto-highlight detected region, show others as accordion. Added "Most Popular" badge for top 3 states.',
      ],
      status: 'complete',
      agent: 'CRO Recommend',
    },
    {
      id: 'rl-1043',
      timestamp: '2026-04-06T08:10:00Z',
      task: 'CRO variant selection for NSW homepage',
      initialConfidence: 0.78,
      finalConfidence: 0.82,
      iterations: 1,
      critiques: [
        'Critique: Blue CTA tested against green — difference not statistically significant at current sample size.',
        'Refinement: Recommend continuing test until n > 1000 per variant. Current confidence insufficient for deployment.',
      ],
      status: 'in_progress',
      agent: 'CRO Recommend',
    },
    {
      id: 'rl-1042',
      timestamp: '2026-04-06T07:30:00Z',
      task: 'Accessibility audit for AR scanner page',
      initialConfidence: 0.45,
      finalConfidence: 0.79,
      iterations: 5,
      critiques: [
        'Critique: Missing keyboard navigation for 3D scene controls.',
        'Refinement: Added OrbitControls keyboard support with arrow keys.',
        'Critique 2: Color contrast on region selector buttons fails WCAG AA.',
        'Refinement 2: Increased contrast from 3.2:1 to 4.8:1.',
        'Critique 3: Screen reader cannot parse 3D canvas content.',
        'Refinement 3: Added aria-label and role="img" with description to canvas.',
      ],
      status: 'complete',
      agent: 'UX Analyzer',
    },
  ];
}

export default function ReflectionLogPage() {
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ReflectionEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(generateReflectionLog());
    setLoaded(true);
  }, []);

  const agents = [...new Set(entries.map((e) => e.agent))];
  const filtered = entries.filter((e) => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterAgent !== 'all' && e.agent !== filterAgent) return false;
    return true;
  });

  if (!loaded) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  const avgImprovement = entries.filter(e => e.status === 'complete').reduce((s, e) => s + (e.finalConfidence - e.initialConfidence), 0) / entries.filter(e => e.status === 'complete').length;
  const avgIterations = entries.filter(e => e.status === 'complete').reduce((s, e) => s + e.iterations, 0) / entries.filter(e => e.status === 'complete').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">🔄 Reflection Log</h1>
        <p className="text-gray-400">
          Self-reflection cycle history. Each entry shows how the AI critiqued and improved its own output.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50 text-center">
          <div className="text-2xl font-bold text-green-400">+{(avgImprovement * 100).toFixed(0)}%</div>
          <div className="text-sm text-gray-400">Avg Confidence Gain</div>
        </div>
        <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50 text-center">
          <div className="text-2xl font-bold text-blue-400">{avgIterations.toFixed(1)}</div>
          <div className="text-sm text-gray-400">Avg Iterations</div>
        </div>
        <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50 text-center">
          <div className="text-2xl font-bold text-purple-400">{entries.filter(e => e.status === 'complete').length}/{entries.length}</div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="complete">Complete</option>
            <option value="in_progress">In Progress</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Agent</label>
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Agents</option>
            {agents.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reflection Entries */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className={`bg-gray-800/60 backdrop-blur rounded-xl border overflow-hidden transition cursor-pointer ${
              selectedEntry?.id === entry.id
                ? 'border-blue-500 bg-blue-900/10'
                : 'border-gray-700/50 hover:border-gray-600'
            }`}
            onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
          >
            {/* Summary Row */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    entry.status === 'complete'
                      ? 'bg-green-500/20 text-green-400'
                      : entry.status === 'in_progress'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {entry.status}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{entry.task}</div>
                  <div className="text-xs text-gray-500">
                    {entry.agent} • {entry.iterations} iterations • {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    <span className="text-yellow-400">{(entry.initialConfidence * 100).toFixed(0)}%</span>
                    <span className="mx-1">→</span>
                    <span className="text-green-400 font-bold">{(entry.finalConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-green-400">+{((entry.finalConfidence - entry.initialConfidence) * 100).toFixed(0)}%</div>
                </div>
                <svg className={`w-5 h-5 text-gray-500 transition-transform ${selectedEntry?.id === entry.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Expanded Critiques */}
            {selectedEntry?.id === entry.id && (
              <div className="px-5 pb-5 border-t border-gray-700/30 pt-4">
                <div className="space-y-3">
                  {entry.critiques.map((critique, i) => (
                    <div key={i} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                      <div className="flex items-start gap-3">
                        <span className={`text-lg flex-shrink-0 ${
                          critique.startsWith('Critique') ? '⚠️' : '✅'
                        }`}>
                          {critique.startsWith('Critique') ? '⚠️' : '✅'}
                        </span>
                        <p className="text-sm text-gray-300 font-mono">{critique}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span>ID: {entry.id}</span>
                  <span>Agent: {entry.agent}</span>
                  <span>Iterations: {entry.iterations}</span>
                  <span>Confidence: {(entry.initialConfidence * 100).toFixed(0)}% → {(entry.finalConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
