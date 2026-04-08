'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/ai-dashboard', icon: '🧠', label: 'Overview' },
  { href: '/ai-dashboard/mcp-explorer', icon: '🔌', label: 'MCP Explorer' },
  { href: '/ai-dashboard/ux-analyzer', icon: '🔍', label: 'UX Analyzer' },
  { href: '/ai-dashboard/reflection-log', icon: '🔄', label: 'Reflection Log' },
];

export default function AIDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [role, setRole] = useState('viewer');

  useEffect(() => {
    const r = typeof document !== 'undefined'
      ? (document.cookie.match(/lc_role=([^;]+)/)?.[1] || 'viewer')
      : 'viewer';
    setRole(r);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-[52px]'} transition-all duration-300 bg-gray-900/80 backdrop-blur-xl border-r border-white/5 fixed h-full flex flex-col z-30`}>
        <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h2 className="text-sm font-extrabold">🧠 AI <span className="text-blue-400">Dashboard</span></h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Role: {role}</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 transition text-xs" aria-label="Toggle sidebar">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm ${
                  active ? 'bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="font-medium truncate text-xs">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/5">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition text-xs">
            <span>🏠</span>
            {sidebarOpen && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      <main className={`flex-1 ${sidebarOpen ? 'ml-60' : 'ml-[52px]'} transition-all duration-300 min-h-screen`}>
        {children}
      </main>
    </div>
  );
}
