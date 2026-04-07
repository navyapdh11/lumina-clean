'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const sidebarNav = [
  { href: '/ai-dashboard', icon: '🧠', label: 'Overview' },
  { href: '/ai-dashboard/mcp-explorer', icon: '🔌', label: 'MCP Explorer' },
  { href: '/ai-dashboard/ux-analyzer', icon: '🔍', label: 'UX Analyzer' },
  { href: '/ai-dashboard/reflection-log', icon: '🔄', label: 'Reflection Log' },
];

export default function AIDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState('viewer');

  useEffect(() => {
    // Fetch role from cookie (server-set, not client-manipulable localStorage)
    // Default to 'viewer' (least privilege) — never default to 'admin'
    const role = typeof window !== 'undefined'
      ? (document.cookie.match(/lc_role=([^;]+)/)?.[1] || 'viewer')
      : 'viewer';
    setUserRole(role);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } transition-all duration-300 bg-gray-900 border-r border-gray-800 flex-shrink-0 flex flex-col fixed h-full`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h2 className="text-lg font-bold">
                🧠 AI <span className="text-blue-400">Dashboard</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Role: {userRole}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {sidebarNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="font-medium truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition text-sm"
          >
            <span>🏠</span>
            {sidebarOpen && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 min-h-screen`}>
        {children}
      </main>
    </div>
  );
}
