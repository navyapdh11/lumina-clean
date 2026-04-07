'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AgentStatus {
  name: string;
  status: 'online' | 'offline' | 'processing';
  confidence: number;
  tasksCompleted: number;
  lastActive: string;
}

interface MCPTool {
  name: string;
  description: string;
  calls: number;
  successRate: number;
}

interface ReflectionCycle {
  id: string;
  task: string;
  iterations: number;
  initialConfidence: number;
  finalConfidence: number;
  status: 'complete' | 'in_progress' | 'failed';
  timestamp: string;
}

function generateAgentStatuses(): AgentStatus[] {
  return [
    { name: 'GoT Reasoner', status: 'online', confidence: 0.92, tasksCompleted: 1247, lastActive: 'Just now' },
    { name: 'Self-Reflection', status: 'processing', confidence: 0.87, tasksCompleted: 892, lastActive: '2s ago' },
    { name: 'MCP Server', status: 'online', confidence: 0.99, tasksCompleted: 3421, lastActive: 'Just now' },
    { name: 'UX Analyzer', status: 'online', confidence: 0.94, tasksCompleted: 567, lastActive: '5s ago' },
    { name: 'GEO/AEO Agent', status: 'online', confidence: 0.91, tasksCompleted: 234, lastActive: '12s ago' },
    { name: 'RAG Retriever', status: 'online', confidence: 0.96, tasksCompleted: 4521, lastActive: 'Just now' },
  ];
}

function generateMCPTools(): MCPTool[] {
  return [
    { name: 'refine_ui', description: 'Refine UI based on GoT analysis', calls: 342, successRate: 0.97 },
    { name: 'analyze_accessibility', description: 'WCAG 2.2 AA compliance audit', calls: 128, successRate: 0.99 },
    { name: 'seo_optimize', description: 'GEO/AEO schema generation', calls: 256, successRate: 0.95 },
    { name: 'cro_recommend', description: 'Conversion rate optimization', calls: 89, successRate: 0.93 },
    { name: 'content_audit', description: 'Content quality analysis', calls: 167, successRate: 0.96 },
    { name: 'performance_check', description: 'Lighthouse performance audit', calls: 445, successRate: 0.98 },
  ];
}

function generateReflectionCycles(): ReflectionCycle[] {
  return [
    { id: 'rc-1047', task: 'Improve booking form conversion', iterations: 3, initialConfidence: 0.62, finalConfidence: 0.91, status: 'complete', timestamp: '2 min ago' },
    { id: 'rc-1046', task: 'Optimize AR scanner UX flow', iterations: 2, initialConfidence: 0.71, finalConfidence: 0.88, status: 'complete', timestamp: '8 min ago' },
    { id: 'rc-1045', task: 'Strata lead scoring model', iterations: 4, initialConfidence: 0.55, finalConfidence: 0.85, status: 'complete', timestamp: '15 min ago' },
    { id: 'rc-1044', task: 'Regional pricing page redesign', iterations: 2, initialConfidence: 0.68, finalConfidence: 0.93, status: 'complete', timestamp: '22 min ago' },
    { id: 'rc-1043', task: 'CRO variant selection NSW', iterations: 1, initialConfidence: 0.78, finalConfidence: 0.82, status: 'in_progress', timestamp: '30 min ago' },
  ];
}

export default function AIDashboardPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [reflections, setReflections] = useState<ReflectionCycle[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAgents(generateAgentStatuses());
    setTools(generateMCPTools());
    setReflections(generateReflectionCycles());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🧠</div>
          <div className="text-white text-lg">Initializing AI agents...</div>
        </div>
      </div>
    );
  }

  const totalTasks = agents.reduce((s, a) => s + a.tasksCompleted, 0);
  const avgConfidence = agents.length ? agents.reduce((s, a) => s + a.confidence, 0) / agents.length : 0;
  const onlineAgents = agents.filter((a) => a.status !== 'offline').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Dashboard — Overview</h1>
        <p className="text-gray-400">
          Self-reflecting AI agents with MCP protocol, LangGraph GoT reasoning, and enterprise RBAC.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50">
          <div className="text-2xl mb-2">🤖</div>
          <div className="text-2xl font-bold text-green-400">{onlineAgents}/{agents.length}</div>
          <div className="text-sm text-gray-400">Agents Online</div>
        </div>
        <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-2xl font-bold text-blue-400">{(avgConfidence * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Avg Confidence</div>
        </div>
        <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-2xl font-bold text-purple-400">{totalTasks.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Tasks</div>
        </div>
        <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50">
          <div className="text-2xl mb-2">🔄</div>
          <div className="text-2xl font-bold text-yellow-400">{reflections.filter((r) => r.status === 'complete').length}</div>
          <div className="text-sm text-gray-400">Reflection Cycles</div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700/50">
          <h3 className="font-semibold text-white">System Architecture</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3 text-sm">
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <div className="font-semibold text-blue-400 mb-2">🎯 Next.js 15 Frontend (This Dashboard)</div>
              <div className="text-gray-300">Sticky Header + RBAC-protected routes + Real-time MCP Explorer + GoT Visualizer</div>
            </div>
            <div className="flex justify-center">
              <span className="text-gray-500">↓ REST + WebSocket + MCP</span>
            </div>
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
              <div className="font-semibold text-purple-400 mb-2">🔌 MCP Protocol Server (FastAPI)</div>
              <div className="text-gray-300">Capabilities negotiation • Resources • Prompts • Tools • OAuth 2.1 + RBAC</div>
            </div>
            <div className="flex justify-center">
              <span className="text-gray-500">↓</span>
            </div>
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
              <div className="font-semibold text-green-400 mb-2">🧠 MAS Factory (LangGraph Orchestrator)</div>
              <div className="text-gray-300">CoT / ToT / GoT • Self-Reflection Cycles (confidence &lt; 0.85) • RAG + Redis Cache • OTel Observability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
          <h3 className="font-semibold text-white">Agent Status</h3>
          <span className="text-xs text-gray-400">{onlineAgents} active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="text-left px-4 py-2">Agent</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Confidence</th>
                <th className="text-right px-4 py-2">Tasks</th>
                <th className="text-left px-4 py-2">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.name} className="border-t border-gray-700/30 hover:bg-gray-700/20 transition">
                  <td className="px-4 py-3 font-medium text-white">{a.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.status === 'online'
                          ? 'bg-green-500/20 text-green-400'
                          : a.status === 'processing'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${a.confidence >= 0.9 ? 'bg-green-500' : a.confidence >= 0.8 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${a.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-300 text-xs">{(a.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{a.tasksCompleted.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MCP Tools + Reflection Cycles Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MCP Tools */}
        <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">🔌 MCP Tools</h3>
            <Link href="/ai-dashboard/mcp-explorer" className="text-xs text-blue-400 hover:underline">
              Explore →
            </Link>
          </div>
          <div className="divide-y divide-gray-700/30">
            {tools.slice(0, 4).map((t) => (
              <div key={t.name} className="px-5 py-3 hover:bg-gray-700/20 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.description}</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{t.calls} calls</div>
                    <div className="text-green-400">{(t.successRate * 100).toFixed(0)}% success</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reflection Cycles */}
        <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">🔄 Reflection Cycles</h3>
            <Link href="/ai-dashboard/reflection-log" className="text-xs text-blue-400 hover:underline">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-700/30">
            {reflections.slice(0, 4).map((r) => (
              <div key={r.id} className="px-5 py-3 hover:bg-gray-700/20 transition">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{r.task}</div>
                    <div className="text-xs text-gray-400">
                      {r.iterations} iterations • {(r.initialConfidence * 100).toFixed(0)}% → {(r.finalConfidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                      r.status === 'complete'
                        ? 'bg-green-500/20 text-green-400'
                        : r.status === 'in_progress'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'MCP Explorer', icon: '🔌', href: '/ai-dashboard/mcp-explorer', gradient: 'from-blue-600 to-blue-700' },
          { label: 'UX Analyzer', icon: '🔍', href: '/ai-dashboard/ux-analyzer', gradient: 'from-purple-600 to-purple-700' },
          { label: 'Reflection Log', icon: '🔄', href: '/ai-dashboard/reflection-log', gradient: 'from-green-600 to-green-700' },
          { label: 'Back to Site', icon: '🏠', href: '/', gradient: 'from-gray-600 to-gray-700' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`bg-gradient-to-br ${action.gradient} hover:opacity-90 text-white font-medium px-5 py-4 rounded-xl transition text-center`}
          >
            <div className="text-2xl mb-1">{action.icon}</div>
            <div className="text-sm">{action.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
