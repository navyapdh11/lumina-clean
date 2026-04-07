'use client';

import { useState, useEffect } from 'react';

interface MCPResource {
  uri: string;
  name: string;
  mimeType: string;
  description: string;
  status: 'available' | 'unavailable';
}

interface ToolResult {
  tool: string;
  status: string;
  trace: string;
  output: string;
  confidence: number;
  reflectionCycles: number;
  timestamp: string;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: { type: string; properties: Record<string, { type: string; description: string }> };
  calls: number;
  successRate: number;
  requiredRole?: string;
}

interface MCPCapability {
  resources: boolean;
  prompts: boolean;
  tools: boolean;
  sampling: boolean;
  streaming: boolean;
  oauth21: boolean;
}

const MCP_RESOURCES: MCPResource[] = [
  { uri: 'ux:knowledge-base', name: 'UX Best Practices 2026', mimeType: 'text/plain', description: 'RAG vector store with 10k+ UX patterns, WCAG guidelines, and conversion heuristics.', status: 'available' },
  { uri: 'ux:current-analysis', name: 'Live Website Analysis', mimeType: 'application/json', description: 'Playwright + Lighthouse results for currently analyzed URLs.', status: 'available' },
  { uri: 'geo:australian-regions', name: 'Australian GEO Data', mimeType: 'application/json', description: 'All 8 states/territories with cities, postcodes, pricing, and timezone data.', status: 'available' },
  { uri: 'cro:variant-store', name: 'CRO Variant Registry', mimeType: 'application/json', description: 'Active A/B test variants, deployment history, and performance metrics.', status: 'available' },
  { uri: 'seo:schema-templates', name: 'SEO/AEO Schema Library', mimeType: 'text/json', description: 'Schema.org templates for LocalBusiness, Service, FAQ, and GEO markup.', status: 'available' },
  { uri: 'audit:compliance-log', name: 'Compliance Audit Trail', mimeType: 'application/json', description: 'WCAG, OWASP, and enterprise compliance check results.', status: 'available' },
];

const MCP_TOOLS: MCPTool[] = [
  {
    name: 'refine_ui',
    description: 'Refine UI based on GoT analysis and self-reflection cycles. Accepts URL and analysis context.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'URL to analyze' }, analysis: { type: 'string', description: 'Current analysis context' } } },
    calls: 342,
    successRate: 0.97,
    requiredRole: 'ux_analyst',
  },
  {
    name: 'analyze_accessibility',
    description: 'WCAG 2.2 AA compliance audit with automated testing and manual review recommendations.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'URL to audit' }, level: { type: 'string', description: 'WCAG level: A, AA, or AAA' } } },
    calls: 128,
    successRate: 0.99,
    requiredRole: 'ux_analyst',
  },
  {
    name: 'seo_optimize',
    description: 'Generate Schema.org markup for LocalBusiness, Service, FAQ, and GEO-targeted content.',
    inputSchema: { type: 'object', properties: { pageType: { type: 'string', description: 'Type of page: home, service, location' }, region: { type: 'string', description: 'Australian state code' } } },
    calls: 256,
    successRate: 0.95,
    requiredRole: 'seo_specialist',
  },
  {
    name: 'cro_recommend',
    description: 'MCTS-based conversion rate optimization recommendations with confidence scores.',
    inputSchema: { type: 'object', properties: { region: { type: 'string', description: 'Target region' }, currentCR: { type: 'number', description: 'Current conversion rate' } } },
    calls: 89,
    successRate: 0.93,
    requiredRole: 'cro_engineer',
  },
  {
    name: 'content_audit',
    description: 'Analyze content quality, readability, SEO alignment, and AEO readiness.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'URL to audit' }, depth: { type: 'string', description: 'Audit depth: basic, standard, deep' } } },
    calls: 167,
    successRate: 0.96,
    requiredRole: 'content_editor',
  },
  {
    name: 'performance_check',
    description: 'Lighthouse performance audit with Core Web Vitals and loading metrics.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'URL to test' } } },
    calls: 445,
    successRate: 0.98,
    requiredRole: 'ux_analyst',
  },
];

const CAPABILITIES: MCPCapability = {
  resources: true,
  prompts: true,
  tools: true,
  sampling: true,
  streaming: true,
  oauth21: true,
};

export default function MCPExplorerPage() {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolPayload, setToolPayload] = useState('');
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'resources' | 'tools' | 'capabilities'>('resources');

  const filteredTools = selectedRole === 'admin'
    ? MCP_TOOLS
    : MCP_TOOLS.filter((t) => !t.requiredRole || t.requiredRole === selectedRole || selectedRole === 'admin');

  const executeTool = async (toolName: string) => {
    setIsExecuting(true);
    // Simulate MCP tool execution
    await new Promise((r) => setTimeout(r, 1500));
    setToolResult({
      tool: toolName,
      status: 'success',
      trace: `mcp-trace-${Date.now()}`,
      output: `Tool "${toolName}" executed successfully. ${toolPayload ? `Input: ${toolPayload}` : 'Using default parameters.'} GoT analysis complete with 92% confidence after 2 reflection cycles.`,
      confidence: 0.92,
      reflectionCycles: 2,
      timestamp: new Date().toISOString(),
    });
    setIsExecuting(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🔌 MCP Explorer</h1>
          <p className="text-gray-400">Browse and test Model Context Protocol resources, prompts, and tools.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Simulate Role:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Admin</option>
            <option value="ux_analyst">UX Analyst</option>
            <option value="seo_specialist">SEO Specialist</option>
            <option value="cro_engineer">CRO Engineer</option>
            <option value="content_editor">Content Editor</option>
          </select>
        </div>
      </div>

      {/* Capability Badges */}
      <div className="bg-gray-800/60 backdrop-blur rounded-xl p-4 border border-gray-700/50">
        <div className="text-sm text-gray-400 mb-3">MCP Capabilities (2026 Spec):</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CAPABILITIES).map(([key, val]) => (
            <span
              key={key}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                val
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              {val ? '✓' : '✗'} {key}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['resources', 'tools', 'capabilities'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="grid md:grid-cols-2 gap-4">
          {MCP_RESOURCES.map((resource) => (
            <div
              key={resource.uri}
              className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50 hover:border-blue-500/50 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">{resource.name}</h3>
                  <p className="text-xs text-blue-400 font-mono mt-0.5 truncate">{resource.uri}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                    resource.status === 'available'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {resource.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{resource.description}</p>
              <span className="inline-block px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
                {resource.mimeType}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TOOLS TAB */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {filteredTools.map((tool) => (
              <div
                key={tool.name}
                className={`bg-gray-800/60 backdrop-blur rounded-xl p-5 border transition cursor-pointer ${
                  selectedTool === tool.name
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700/50 hover:border-gray-600'
                }`}
                onClick={() => {
                  setSelectedTool(tool.name);
                  setToolResult(null);
                  setToolPayload('');
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{tool.name}</h3>
                  <span className="text-xs text-gray-500">{tool.calls} calls</span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{tool.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-400">{(tool.successRate * 100).toFixed(0)}% success</span>
                  {tool.requiredRole && (
                    <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">{tool.requiredRole}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tool Execution Panel */}
          {selectedTool && (
            <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Execute: <span className="text-blue-400">{selectedTool}</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Payload (JSON)</label>
                  <textarea
                    value={toolPayload}
                    onChange={(e) => setToolPayload(e.target.value)}
                    placeholder='{"url": "https://lumina-clean.com.au"}'
                    className="w-full h-24 px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => executeTool(selectedTool)}
                  disabled={isExecuting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition"
                >
                  {isExecuting ? '⏳ Executing...' : '▶ Execute Tool'}
                </button>

                {toolResult && (
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 font-mono text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-400">✓</span>
                      <span className="text-white font-sans font-semibold">Result</span>
                      <span className="text-gray-500 text-xs ml-auto">{toolResult.trace}</span>
                    </div>
                    <pre className="text-gray-300 whitespace-pre-wrap">{toolResult.output}</pre>
                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                      <span>Confidence: {(toolResult.confidence * 100).toFixed(0)}%</span>
                      <span>Reflections: {toolResult.reflectionCycles}</span>
                      <span>{new Date(toolResult.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CAPABILITIES TAB */}
      {activeTab === 'capabilities' && (
        <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">MCP Protocol Capabilities</h3>
          <div className="space-y-4">
            {Object.entries(CAPABILITIES).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-700/30 last:border-0">
                <div>
                  <div className="text-white font-medium">{key}</div>
                  <div className="text-sm text-gray-400">
                    {key === 'resources' && 'Expose data sources as URIs for agent discovery'}
                    {key === 'prompts' && 'Template-based prompt generation with parameter injection'}
                    {key === 'tools' && 'Executable functions with typed input/output schemas'}
                    {key === 'sampling' && 'LLM sampling for context-aware responses'}
                    {key === 'streaming' && 'SSE/WebSocket streaming for real-time agent output'}
                    {key === 'oauth21' && 'OAuth 2.1 + OIDC for secure authentication and authorization'}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${val ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {val ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
