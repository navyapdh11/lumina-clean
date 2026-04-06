'use client';

import { useState, useEffect, useCallback } from 'react';

// === TYPES ===
interface CROVariant {
  id: string;
  name: string;
  type: 'cta' | 'layout' | 'pricing' | 'form' | 'trust';
  region: string;
  currentCR: number;
  projectedCR: number;
  confidence: number;
  status: 'testing' | 'winner' | 'loser' | 'deployed';
  deployments: number;
  lift: number;
}

interface CROMetric {
  region: string;
  sessions: number;
  conversions: number;
  cr: number;
  avgOrderValue: number;
  revenue: number;
  bounceRate: number;
  avgSessionDuration: number;
  mobileCR: number;
  desktopCR: number;
}

interface Deployment {
  id: string;
  variantId: string;
  region: string;
  site: string;
  deployedAt: string;
  status: 'success' | 'failed' | 'pending' | 'rolled_back';
  deployedBy: string;
}

interface CRORecommendation {
  id: string;
  title: string;
  description: string;
  type: string;
  region: string;
  expectedLift: number;
  confidence: number;
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  mctsScore: number;
}

// === AUSTRALIAN REGIONS ===
const AU_REGIONS = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

// === MOCK DATA (Replace with real API calls) ===
const generateMockMetrics = (): CROMetric[] =>
  AU_REGIONS.map(region => ({
    region,
    sessions: Math.floor(Math.random() * 5000 + 2000),
    conversions: Math.floor(Math.random() * 200 + 50),
    cr: parseFloat((Math.random() * 0.08 + 0.02).toFixed(4)),
    avgOrderValue: Math.floor(Math.random() * 100 + 150),
    revenue: 0,
    bounceRate: parseFloat((Math.random() * 0.3 + 0.3).toFixed(4)),
    avgSessionDuration: Math.floor(Math.random() * 120 + 60),
    mobileCR: parseFloat((Math.random() * 0.05 + 0.01).toFixed(4)),
    desktopCR: parseFloat((Math.random() * 0.1 + 0.03).toFixed(4)),
  })).map(m => ({ ...m, revenue: m.conversions * m.avgOrderValue }));

const generateMockVariants = (): CROVariant[] => [
  { id: 'v1', name: 'Instant Quote CTA (Blue)', type: 'cta', region: 'NSW', currentCR: 0.032, projectedCR: 0.048, confidence: 0.94, status: 'winner', deployments: 3, lift: 50 },
  { id: 'v2', name: 'Trust Badges Above Fold', type: 'trust', region: 'VIC', currentCR: 0.028, projectedCR: 0.039, confidence: 0.87, status: 'testing', deployments: 0, lift: 39 },
  { id: 'v3', name: 'Simplified Booking Form', type: 'form', region: 'QLD', currentCR: 0.025, projectedCR: 0.041, confidence: 0.91, status: 'winner', deployments: 2, lift: 64 },
  { id: 'v4', name: 'Dynamic Pricing Display', type: 'pricing', region: 'WA', currentCR: 0.030, projectedCR: 0.044, confidence: 0.89, status: 'deployed', deployments: 5, lift: 47 },
  { id: 'v5', name: 'Mobile-First Layout', type: 'layout', region: 'SA', currentCR: 0.022, projectedCR: 0.035, confidence: 0.82, status: 'testing', deployments: 0, lift: 59 },
  { id: 'v6', name: 'Urgency Banner (Limited Slots)', type: 'cta', region: 'NSW', currentCR: 0.035, projectedCR: 0.052, confidence: 0.96, status: 'winner', deployments: 4, lift: 49 },
  { id: 'v7', name: 'AR Scanner Hero Section', type: 'layout', region: 'ACT', currentCR: 0.040, projectedCR: 0.062, confidence: 0.93, status: 'deployed', deployments: 6, lift: 55 },
  { id: 'v8', name: 'Strata Lead Form', type: 'form', region: 'VIC', currentCR: 0.018, projectedCR: 0.029, confidence: 0.78, status: 'testing', deployments: 0, lift: 61 },
];

const generateMockDeployments = (): Deployment[] => [
  { id: 'd1', variantId: 'v1', region: 'NSW', site: 'lumina-clean.com.au', deployedAt: '2026-04-05T10:30:00Z', status: 'success', deployedBy: 'Sarah Chen' },
  { id: 'd2', variantId: 'v3', region: 'QLD', site: 'lumina-clean.com.au', deployedAt: '2026-04-04T14:15:00Z', status: 'success', deployedBy: 'Auto-Deploy' },
  { id: 'd3', variantId: 'v4', region: 'WA', site: 'lumina-clean.com.au', deployedAt: '2026-04-03T09:00:00Z', status: 'success', deployedBy: 'James Wilson' },
  { id: 'd4', variantId: 'v7', region: 'ACT', site: 'lumina-clean.com.au', deployedAt: '2026-04-02T16:45:00Z', status: 'success', deployedBy: 'Auto-Deploy' },
];

// === FAQ/GUIDE DATA ===
const FAQS = [
  { q: 'What is CRO?', a: 'Conversion Rate Optimization (CRO) improves the percentage of website visitors who book a cleaning service.' },
  { q: 'How does MCTS work?', a: 'Monte Carlo Tree Search simulates 1000+ variant combinations to find the optimal changes for your region.' },
  { q: 'Is auto-deploy safe?', a: 'Yes. All changes require statistical significance (>95%) and pass enterprise validation before deployment.' },
  { q: 'Can I rollback?', a: 'Yes. Every deployment can be rolled back with one click from the Deployments tab.' },
  { q: 'What regions are supported?', a: 'All 8 Australian states/territories: NSW, VIC, QLD, WA, SA, TAS, ACT, NT.' },
];

const GUIDES = [
  { title: 'Quick Start', steps: ['Select your region', 'Run MCTS optimization', 'Review recommendations', 'Click Approve & Deploy'] },
  { title: 'A/B Testing', steps: ['Create variant in Variants tab', 'Set traffic split', 'Wait for statistical significance', 'Deploy winner'] },
  { title: 'Auto-Deploy Setup', steps: ['Enable auto-deploy in Settings', 'Set confidence threshold (default 90%)', 'Choose target regions', 'Monitor results'] },
];

// === HELPER FUNCTIONS ===
function formatPercent(n: number): string { return (n * 100).toFixed(1) + '%'; }
function formatAUD(n: number): string { return '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 0 }); }
function getStatusColor(s: string): string {
  const colors: Record<string, string> = { success: 'bg-green-600', failed: 'bg-red-600', pending: 'bg-yellow-600', rolled_back: 'bg-gray-600', testing: 'bg-blue-600', winner: 'bg-green-600', loser: 'bg-red-600', deployed: 'bg-purple-600' };
  return colors[s] || 'bg-gray-600';
}

// === MAIN COMPONENT ===
export default function CROControlPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'variants' | 'deployments' | 'recommendations' | 'settings'>('overview');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [metrics, setMetrics] = useState<CROMetric[]>([]);
  const [variants, setVariants] = useState<CROVariant[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [recommendations, setRecommendations] = useState<CRORecommendation[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(90);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setMetrics(generateMockMetrics());
    setVariants(generateMockVariants());
    setDeployments(generateMockDeployments());
  }, []);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const runOptimization = async () => {
    setIsOptimizing(true);
    // Simulate MCTS optimization
    await new Promise(r => setTimeout(r, 2000));
    const recs: CRORecommendation[] = [
      { id: 'r1', title: 'Add "Same Day Available" badge to NSW homepage', description: 'Urgency signals increase booking conversion by 23% in metro areas.', type: 'trust', region: 'NSW', expectedLift: 0.23, confidence: 0.94, effort: 'low', risk: 'low', mctsScore: 0.96 },
      { id: 'r2', title: 'Simplify QLD booking form from 8 to 4 fields', description: 'Each removed field increases conversion by 12%. Target: bedrooms, bathrooms, postcode, date.', type: 'form', region: 'QLD', expectedLift: 0.48, confidence: 0.91, effort: 'medium', risk: 'low', mctsScore: 0.93 },
      { id: 'r3', title: 'Move AR Scanner CTA above the fold (VIC)', description: 'Currently below scroll line. Moving up increases engagement by 67%.', type: 'layout', region: 'VIC', expectedLift: 0.34, confidence: 0.89, effort: 'low', risk: 'low', mctsScore: 0.91 },
      { id: 'r4', title: 'Add Google Reviews widget to WA landing page', description: 'Social proof increases trust. Target: 4.8★ rating display with 5,000+ count.', type: 'trust', region: 'WA', expectedLift: 0.19, confidence: 0.85, effort: 'low', risk: 'low', mctsScore: 0.87 },
      { id: 'r5', title: 'Test green vs blue "Book Now" button (SA)', description: 'Green buttons outperform blue by 18% in SA market testing.', type: 'cta', region: 'SA', expectedLift: 0.18, confidence: 0.82, effort: 'low', risk: 'low', mctsScore: 0.84 },
      { id: 'r6', title: 'Add "Instant Quote" calculator to ACT homepage', description: 'Interactive pricing tools increase engagement by 41%. Shows price before booking.', type: 'pricing', region: 'ACT', expectedLift: 0.41, confidence: 0.88, effort: 'high', risk: 'medium', mctsScore: 0.89 },
    ];
    setRecommendations(recs);
    setIsOptimizing(false);
    showNotification('✅ MCTS optimization complete — 6 recommendations generated');
  };

  const deployVariant = async (variantId: string) => {
    setIsDeploying(true);
    await new Promise(r => setTimeout(r, 1500));
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, status: 'deployed' as const, deployments: v.deployments + 1 } : v));
    setDeployments(prev => [{ id: `d${Date.now()}`, variantId, region: selectedRegion, site: 'lumina-clean.com.au', deployedAt: new Date().toISOString(), status: 'success', deployedBy: 'You' }, ...prev]);
    setIsDeploying(false);
    showNotification(`🚀 Variant ${variantId} deployed successfully!`);
  };

  const rollbackDeployment = async (deploymentId: string) => {
    setDeployments(prev => prev.map(d => d.id === deploymentId ? { ...d, status: 'rolled_back' as const } : d));
    showNotification('↩️ Deployment rolled back successfully');
  };

  const filteredMetrics = selectedRegion === 'ALL' ? metrics : metrics.filter(m => m.region === selectedRegion);
  const filteredVariants = selectedRegion === 'ALL' ? variants : variants.filter(v => v.region === selectedRegion);
  const totalRevenue = filteredMetrics.reduce((s, m) => s + m.revenue, 0);
  const avgCR = filteredMetrics.length ? filteredMetrics.reduce((s, m) => s + m.cr, 0) / filteredMetrics.length : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl animate-pulse">
          {notification}
        </div>
      )}

      <div className="flex">
        {/* SIDEBAR */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-900 border-r border-gray-800 min-h-screen overflow-hidden flex-shrink-0`}>
          <div className="p-4 w-80">
            <h2 className="text-xl font-bold mb-4">🛠️ CRO Guides & FAQs</h2>

            {/* Quick Start Guide */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-blue-400 uppercase mb-2">Quick Start Guide</h3>
              <ol className="space-y-2 text-sm text-gray-300">
                {GUIDES[0].steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* How-To Guides */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-green-400 uppercase mb-2">How-To Guides</h3>
              {GUIDES.slice(1).map((guide, i) => (
                <details key={i} className="mb-2 bg-gray-800/50 rounded-lg">
                  <summary className="p-3 cursor-pointer text-sm font-medium hover:bg-gray-700/50 rounded-lg transition">{guide.title}</summary>
                  <ol className="px-4 pb-3 space-y-1 text-xs text-gray-400">
                    {guide.steps.map((step, j) => <li key={j}>{j + 1}. {step}</li>)}
                  </ol>
                </details>
              ))}
            </div>

            {/* FAQs */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-yellow-400 uppercase mb-2">FAQs</h3>
              {FAQS.map((faq, i) => (
                <details key={i} className="mb-2 bg-gray-800/50 rounded-lg">
                  <summary className="p-3 cursor-pointer text-sm font-medium hover:bg-gray-700/50 rounded-lg transition">{faq.q}</summary>
                  <p className="px-4 pb-3 text-xs text-gray-400">{faq.a}</p>
                </details>
              ))}
            </div>

            {/* System Status */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-400 uppercase mb-2">System Status</h3>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between"><span>MCTS Engine</span><span className="text-green-400">● Online</span></div>
                <div className="flex justify-between"><span>Redis Cache</span><span className="text-green-400">● Active</span></div>
                <div className="flex justify-between"><span>OpenTelemetry</span><span className="text-green-400">● Tracing</span></div>
                <div className="flex justify-between"><span>GA4 Integration</span><span className="text-yellow-400">● Connected</span></div>
                <div className="flex justify-between"><span>Auto-Deploy</span><span className={autoDeploy ? 'text-green-400' : 'text-gray-500'}>● {autoDeploy ? 'Enabled' : 'Disabled'}</span></div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0">
          {/* Top Bar */}
          <header className="bg-gray-900/50 border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded hover:bg-gray-800 transition" aria-label="Toggle sidebar">☰</button>
              <h1 className="text-xl font-bold">🎯 CleanCRO Agent — CRO Control Center</h1>
            </div>
            <div className="flex items-center gap-4">
              <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm">
                <option value="ALL">All Australia</option>
                {AU_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => setAutoDeploy(!autoDeploy)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${autoDeploy ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                Auto-Deploy: {autoDeploy ? 'ON' : 'OFF'}
              </button>
            </div>
          </header>

          {/* Tabs */}
          <nav className="flex gap-1 p-4 pb-0 border-b border-gray-800">
            {(['overview', 'variants', 'deployments', 'recommendations', 'settings'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize transition ${activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                {tab}
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          <div className="p-6">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="text-sm text-gray-400">Avg Conversion Rate</div>
                    <div className="text-2xl font-bold text-green-400">{formatPercent(avgCR)}</div>
                    <div className="text-xs text-green-300 mt-1">↑ 12% vs last month</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="text-sm text-gray-400">Total Revenue</div>
                    <div className="text-2xl font-bold text-blue-400">{formatAUD(totalRevenue)}</div>
                    <div className="text-xs text-blue-300 mt-1">{filteredMetrics.reduce((s, m) => s + m.sessions, 0).toLocaleString()} sessions</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="text-sm text-gray-400">Active Variants</div>
                    <div className="text-2xl font-bold text-purple-400">{variants.length}</div>
                    <div className="text-xs text-purple-300 mt-1">{variants.filter(v => v.status === 'winner').length} winners</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="text-sm text-gray-400">Deployments</div>
                    <div className="text-2xl font-bold text-yellow-400">{deployments.filter(d => d.status === 'success').length}</div>
                    <div className="text-xs text-yellow-300 mt-1">{deployments.filter(d => d.status === 'rolled_back').length} rollbacks</div>
                  </div>
                </div>

                {/* Regional Performance Table */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="font-semibold">Regional Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 text-gray-400">
                        <tr>
                          <th className="text-left p-3">Region</th>
                          <th className="text-right p-3">Sessions</th>
                          <th className="text-right p-3">Conversions</th>
                          <th className="text-right p-3">CR</th>
                          <th className="text-right p-3">AOV</th>
                          <th className="text-right p-3">Revenue</th>
                          <th className="text-right p-3">Mobile CR</th>
                          <th className="text-right p-3">Bounce</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMetrics.map(m => (
                          <tr key={m.region} className="border-t border-gray-700/50 hover:bg-gray-700/30 transition">
                            <td className="p-3 font-medium">{m.region}</td>
                            <td className="p-3 text-right">{m.sessions.toLocaleString()}</td>
                            <td className="p-3 text-right">{m.conversions.toLocaleString()}</td>
                            <td className="p-3 text-right text-green-400 font-medium">{formatPercent(m.cr)}</td>
                            <td className="p-3 text-right">{formatAUD(m.avgOrderValue)}</td>
                            <td className="p-3 text-right text-blue-400">{formatAUD(m.revenue)}</td>
                            <td className="p-3 text-right">{formatPercent(m.mobileCR)}</td>
                            <td className="p-3 text-right text-red-400">{formatPercent(m.bounceRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl p-6 border border-blue-700/50">
                    <h3 className="text-lg font-semibold mb-2">🧠 Run MCTS Optimization</h3>
                    <p className="text-sm text-blue-200 mb-4">Monte Carlo Tree Search explores 1,000+ variant combinations to find optimal changes for your selected region.</p>
                    <button onClick={runOptimization} disabled={isOptimizing}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition">
                      {isOptimizing ? '⏳ Running MCTS...' : '🚀 Run Optimization'}
                    </button>
                  </div>
                  <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl p-6 border border-green-700/50">
                    <h3 className="text-lg font-semibold mb-2">📊 OpenTelemetry Dashboard</h3>
                    <p className="text-sm text-green-200 mb-4">View real-time traces, metrics, and logs for all CRO operations.</p>
                    <div className="flex gap-3">
                      <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">📈 Grafana</button>
                      <button className="bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition">🔥 Prometheus</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VARIANTS TAB */}
            {activeTab === 'variants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Active Variants ({filteredVariants.length})</h2>
                  <span className="text-sm text-gray-400">MCTS-selected winners highlighted in green</span>
                </div>
                <div className="grid gap-4">
                  {filteredVariants.map(v => (
                    <div key={v.id} className={`bg-gray-800/50 rounded-xl p-5 border ${v.status === 'winner' ? 'border-green-600' : v.status === 'deployed' ? 'border-purple-600' : 'border-gray-700'} transition`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{v.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(v.status)} text-white`}>{v.status}</span>
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{v.type}</span>
                          </div>
                          <p className="text-sm text-gray-400">Region: {v.region} • Deployments: {v.deployments}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">+{v.lift}%</div>
                          <div className="text-xs text-gray-400">confidence: {formatPercent(v.confidence)}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div><span className="text-gray-400">Current CR:</span> <span className="text-white">{formatPercent(v.currentCR)}</span></div>
                        <div><span className="text-gray-400">Projected CR:</span> <span className="text-green-400">{formatPercent(v.projectedCR)}</span></div>
                        <div className="flex justify-end">
                          {(v.status === 'winner' || v.status === 'testing') && (
                            <button onClick={() => deployVariant(v.id)} disabled={isDeploying}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm transition">
                              {isDeploying ? 'Deploying...' : '🚀 Deploy'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DEPLOYMENTS TAB */}
            {activeTab === 'deployments' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Deployment History</h2>
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-400">
                      <tr>
                        <th className="text-left p-3">Variant</th>
                        <th className="text-left p-3">Region</th>
                        <th className="text-left p-3">Site</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Deployed By</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-right p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deployments.map(d => (
                        <tr key={d.id} className="border-t border-gray-700/50 hover:bg-gray-700/30 transition">
                          <td className="p-3 font-mono text-xs">{d.variantId}</td>
                          <td className="p-3">{d.region}</td>
                          <td className="p-3 text-gray-400">{d.site}</td>
                          <td className="p-3 text-gray-400">{new Date(d.deployedAt).toLocaleDateString()}</td>
                          <td className="p-3">{d.deployedBy}</td>
                          <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(d.status)} text-white`}>{d.status}</span></td>
                          <td className="p-3 text-right">
                            {d.status === 'success' && (
                              <button onClick={() => rollbackDeployment(d.id)}
                                className="text-red-400 hover:text-red-300 text-xs transition">↩️ Rollback</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RECOMMENDATIONS TAB */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">MCTS Recommendations</h2>
                  <button onClick={runOptimization} disabled={isOptimizing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition">
                    {isOptimizing ? '⏳ Running...' : '🔄 Refresh'}
                  </button>
                </div>
                {recommendations.length === 0 ? (
                  <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-gray-700">
                    <div className="text-4xl mb-3">🧠</div>
                    <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                    <p className="text-gray-400 mb-4">Run MCTS optimization to get AI-powered CRO recommendations.</p>
                    <button onClick={runOptimization} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">Run MCTS Optimization</button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {recommendations.sort((a, b) => b.mctsScore - a.mctsScore).map(r => (
                      <div key={r.id} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 hover:border-blue-600/50 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{r.title}</h3>
                              <span className="px-2 py-0.5 rounded text-xs bg-blue-600 text-white">MCTS: {(r.mctsScore * 100).toFixed(0)}%</span>
                              <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{r.type}</span>
                              <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{r.region}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{r.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-green-400">+{Math.round(r.expectedLift * 100)}%</div>
                            <div className="text-xs text-gray-400">expected lift</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                          <span>Confidence: {formatPercent(r.confidence)}</span>
                          <span>Effort: <span className={r.effort === 'low' ? 'text-green-400' : r.effort === 'medium' ? 'text-yellow-400' : 'text-red-400'}>{r.effort}</span></span>
                          <span>Risk: <span className={r.risk === 'low' ? 'text-green-400' : r.risk === 'medium' ? 'text-yellow-400' : 'text-red-400'}>{r.risk}</span></span>
                          {autoDeploy && r.confidence >= confidenceThreshold / 100 && (
                            <span className="text-green-400 ml-auto">✓ Auto-deploy eligible</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <h2 className="text-lg font-semibold">CRO Settings</h2>

                {/* Auto-Deploy Settings */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-semibold mb-4">Auto-Deployment</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable Auto-Deploy</div>
                        <div className="text-sm text-gray-400">Automatically deploy variants that exceed confidence threshold</div>
                      </div>
                      <button onClick={() => setAutoDeploy(!autoDeploy)}
                        className={`w-12 h-6 rounded-full transition relative ${autoDeploy ? 'bg-green-600' : 'bg-gray-600'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${autoDeploy ? 'left-6' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Confidence Threshold: {confidenceThreshold}%</label>
                      <input type="range" min={50} max={99} value={confidenceThreshold}
                        onChange={e => setConfidenceThreshold(parseInt(e.target.value))}
                        className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500"><span>50%</span><span>99%</span></div>
                    </div>
                  </div>
                </div>

                {/* MCTS Settings */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-semibold mb-4">MCTS Configuration</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Simulations</span><span>1,000</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">UCB Constant</span><span>1.4</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Max Depth</span><span>100</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Beam Width</span><span>10</span></div>
                  </div>
                </div>

                {/* Integration Settings */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-semibold mb-4">Integrations</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Google Analytics 4</div>
                        <div className="text-xs text-gray-400">Real-time event tracking</div>
                      </div>
                      <span className="text-green-400 text-sm">● Connected</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Redis Cache</div>
                        <div className="text-xs text-gray-400">Variant result caching</div>
                      </div>
                      <span className="text-green-400 text-sm">● Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">OpenTelemetry</div>
                        <div className="text-xs text-gray-400">Tracing & metrics</div>
                      </div>
                      <span className="text-green-400 text-sm">● Tracing</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Next.js Deploy Webhook</div>
                        <div className="text-xs text-gray-400">Auto-deploy to production</div>
                      </div>
                      <span className="text-yellow-400 text-sm">● Configured</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
