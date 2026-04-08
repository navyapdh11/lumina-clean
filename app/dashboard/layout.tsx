'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  if (!ready) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl animate-pulse">📊</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      <nav className="bg-gray-900/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 text-blue-400 font-bold text-lg">
          <LayoutDashboard size={22} />
          <span className="hidden sm:inline">LuminaClean Dashboard</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 transition text-sm font-medium">
          <LogOut size={16} /> Sign Out
        </Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}
