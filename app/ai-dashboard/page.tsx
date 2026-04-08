'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function genAgents() {
  return [
    { name: 'GoT Reasoner', status: 'online' as const, confidence: 0.92, tasks: 1247, last: 'Just now' },
    { name: 'Self-Reflection', status: 'processing' as const, confidence: 0.87, tasks: 892, last: '2s ago' },
    { name: 'MCP Server', status: 'online' as const, confidence: 0.99, tasks: 3421, last: 'Just now' },
    { name: 'UX Analyzer', status: 'online' as const, confidence: 0.94, tasks: 567, last: '5s ago' },
    { name: 'GEO/AEO Agent', status: 'online' as const, confidence: 0.91, tasks: 234, last: '12s ago' },
    { name: 'RAG Retriever', status: 'online' as const, confidence: 0.96, tasks: 4521, last: 'Just now' },
  ];
}

function genTools() {
  return [
    { name: 'refine_ui', desc: 'Refine UI via GoT analysis', calls: 342, rate: 0.97 },
    { name: 'analyze_accessibility', desc: 'WCAG 2.2 AA audit', calls: 128, rate: 0.99 },
    { name: 'seo_optimize', desc: 'GEO/AEO schema generation', calls: 256, rate: 0.95 },
    { name: 'cro_recommend', desc: 'Conversion optimization', calls: 89, rate: 0.93 },
  ];
}

function genReflections() {
  return [
    { id: 'rc-1047', task: 'Improve booking form conversion', iter: 3, ci: 0.62, cf: 0.91, status: 'complete' as const },
    { id: 'rc-1046', task: 'Optimize AR scanner UX', iter: 2, ci: 0.71, cf: 0.88, status: 'complete' as const },
    { id: 'rc-1045', task: 'Strata lead scoring model', iter: 4, ci: 0.55, cf: 0.85, status: 'complete' as const },
    { id: 'rc-1044', task: 'Regional pricing redesign', iter: 2, ci: 0.68, cf: 0.93, status: 'complete' as const },
    { id: 'rc-1043', task: 'CRO variant selection NSW', iter: 1, ci: 0.78, cf: 0.82, status: 'in_progress' as const },
  ];
}

export default function AIDashboardPage() {
  const [agents, setAgents] = useState(genAgents);
  const [tools, setTools] = useState(genTools);
  const [refs, setRefs] = useState(genReflections);
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  if (!ready) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-3xl animate-pulse">🧠</div></div>;

  const online = agents.filter(a => a.status !== 'offline').length;
  const avgC = agents.reduce((s, a) => s + a.confidence, 0) / agents.length;
  const total = agents.reduce((s, a) => s + a.tasks, 0);
  const done = refs.filter(r => r.status === 'complete').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">AI Dashboard</h1>
        <p className="text-gray-400 text-sm sm:text-base">Self-reflecting AI agents · MCP protocol · LangGraph GoT reasoning</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🤖', val: `${online}/${agents.length}`, label: 'Agents Online', color: 'text-emerald-400' },
          { icon: '📊', val: `${(avgC * 100).toFixed(1)}%`, label: 'Avg Confidence', color: 'text-blue-400' },
          { icon: '⚡', val: total.toLocaleString(), label: 'Total Tasks', color: 'text-purple-400' },
          { icon: '🔄', val: `${done}/${refs.length}`, label: 'Reflection Cycles', color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-5 border border-white/5">
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.val}</div>
            <div className="text-sm text-gray-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Architecture */}
      <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-white/5">
          <h3 className="font-bold text-white">System Architecture</h3>
        </div>
        <div className="p-5 sm:p-6 space-y-3 text-sm">
          {[
            { color: 'blue', title: '🎯 Next.js 15 Frontend', desc: 'Sticky Header · RBAC routes · MCP Explorer · GoT Visualizer' },
            { color: 'purple', title: '🔌 MCP Protocol Server', desc: 'Capabilities · Resources · Prompts · Tools · OAuth 2.1 + RBAC' },
            { color: 'emerald', title: '🧠 MAS Factory (LangGraph)', desc: 'CoT / ToT / GoT · Self-Reflection · RAG + Redis · OTel' },
          ].map((l, i) => (
            <div key={i}>
              <div className={`bg-${l.color}-600/10 border border-${l.color}-500/20 rounded-xl p-4`}>
                <div className={`font-bold text-${l.color}-400 mb-1`}>{l.title}</div>
                <div className="text-gray-400 text-xs">{l.desc}</div>
              </div>
              {i < 2 && <div className="flex justify-center text-gray-600 text-xs py-1">↓</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-white">Agent Status</h3>
          <span className="text-xs text-gray-500">{online} active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase">
                <th className="text-left px-4 sm:px-6 py-3 font-medium">Agent</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Confidence</th>
                <th className="text-right px-4 py-3 font-medium">Tasks</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.name} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-4 sm:px-6 py-3 font-medium text-white text-xs sm:text-sm">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      a.status === 'online' ? 'bg-emerald-500/15 text-emerald-400' :
                      a.status === 'processing' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-800 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${a.confidence >= 0.9 ? 'bg-emerald-500' : a.confidence >= 0.8 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${a.confidence * 100}%` }} />
                      </div>
                      <span className="text-gray-400 text-xs">{(a.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 text-xs">{a.tasks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{a.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tools + Reflections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-white">🔌 MCP Tools</h3>
            <Link href="/ai-dashboard/mcp-explorer" className="text-xs text-blue-400 hover:underline">Explore →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {tools.map(t => (
              <div key={t.name} className="px-5 sm:px-6 py-3 hover:bg-white/[0.02] transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.desc}</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{t.calls} calls</div>
                    <div className="text-emerald-400">{(t.rate * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-white">🔄 Reflection Cycles</h3>
            <Link href="/ai-dashboard/reflection-log" className="text-xs text-blue-400 hover:underline">View All →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {refs.map(r => (
              <div key={r.id} className="px-5 sm:px-6 py-3 hover:bg-white/[0.02] transition">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{r.task}</div>
                    <div className="text-xs text-gray-500">{r.iter} iter · {(r.ci * 100).toFixed(0)}% → {(r.cf * 100).toFixed(0)}%</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ml-2 ${
                    r.status === 'complete' ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-amber-500/15 text-amber-400'
                  }`}>{r.status === 'complete' ? 'done' : 'running'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'MCP Explorer', icon: '🔌', href: '/ai-dashboard/mcp-explorer', g: 'from-blue-600 to-blue-700' },
          { label: 'UX Analyzer', icon: '🔍', href: '/ai-dashboard/ux-analyzer', g: 'from-purple-600 to-purple-700' },
          { label: 'Reflection Log', icon: '🔄', href: '/ai-dashboard/reflection-log', g: 'from-emerald-600 to-emerald-700' },
          { label: 'Back to Site', icon: '🏠', href: '/', g: 'from-gray-700 to-gray-800' },
        ].map(a => (
          <Link key={a.label} href={a.href} className={`bg-gradient-to-br ${a.g} hover:opacity-90 text-white font-semibold px-5 py-5 rounded-2xl transition text-center hover:-translate-y-0.5 shadow-lg`}>
            <div className="text-2xl mb-1">{a.icon}</div>
            <div className="text-sm">{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
