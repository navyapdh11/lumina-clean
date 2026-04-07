'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function DashboardPage() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project');
    setIsConfigured(!!hasSupabase);
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">LuminaClean Dashboard</h1>

      {!isConfigured ? (
        <div className="space-y-6">
          <p className="text-gray-400">
            Configure <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> environment variables
            to enable full dashboard functionality.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="font-semibold text-lg mb-2">🔍 AR Scanner</h2>
              <p className="text-sm text-gray-400">Active and ready</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="font-semibold text-lg mb-2">📊 Strata Leads</h2>
              <p className="text-sm text-gray-400">52,000+ leads available</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="font-semibold text-lg mb-2">📅 Bookings</h2>
              <p className="text-sm text-gray-400">Requires Supabase config</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>
            <p className="text-gray-500">No bookings yet. Create your first booking to see it here.</p>
          </div>
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <ul className="space-y-2">
              <li><Link href="/residential/ar-scanner" className="text-blue-400 hover:underline">🔍 Start AR Scanner</Link></li>
              <li><Link href="/dashboard" className="text-blue-400 hover:underline">📊 View Metrics</Link></li>
              <li><Link href="/admin/cro-control" className="text-blue-400 hover:underline">🎯 CRO Control</Link></li>
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
