'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for mock session in dev mode (no Supabase configured)
    const isDev = process.env.NODE_ENV === 'development';
    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project');

    if (!hasSupabase || isDev) {
      // Allow access in dev/demo mode
      setIsAuthenticated(true);
      return;
    }

    // In production with Supabase, check session
    // This would use @supabase/ssr createBrowserClient
    setIsAuthenticated(true);
  }, []);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <LayoutDashboard size={24} />
          LuminaClean Dashboard
        </Link>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-600"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
