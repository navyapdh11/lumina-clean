'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────
interface MetricCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

interface Booking {
  id: string;
  region: string;
  type: string;
  date: string;
  status: 'confirmed' | 'pending' | 'completed';
  price: number;
  area: number;
}

interface Activity {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: string;
}

// ── Mock Data Generators ───────────────────────────────────────────
const REGIONS = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;
const BOOKING_TYPES = ['Bond Clean', 'Strata Clean', 'Commercial', 'Residential', 'End of Lease'] as const;
const STATUSES = ['confirmed', 'pending', 'completed'] as const;

function generateMetrics(): MetricCard[] {
  return [
    { label: 'Total Revenue', value: '$48,350', change: '+12.5%', positive: true, icon: '💰' },
    { label: 'Active Bookings', value: '23', change: '+5 this week', positive: true, icon: '📅' },
    { label: 'AR Scans Today', value: '147', change: '+18% vs yesterday', positive: true, icon: '📐' },
    { label: 'Conversion Rate', value: '4.8%', change: '-0.3%', positive: false, icon: '📊' },
  ];
}

function generateBookings(): Booking[] {
  const bookings: Booking[] = [];
  for (let i = 0; i < 8; i++) {
    const day = 6 - i;
    const date = new Date();
    date.setDate(date.getDate() - day);
    bookings.push({
      id: `BK-${1000 + i}`,
      region: REGIONS[i % REGIONS.length],
      type: BOOKING_TYPES[i % BOOKING_TYPES.length],
      date: date.toISOString().split('T')[0],
      status: STATUSES[i % STATUSES.length],
      price: Math.floor(Math.random() * 300 + 150),
      area: Math.floor(Math.random() * 80 + 30),
    });
  }
  return bookings;
}

function generateActivity(): Activity[] {
  return [
    { id: '1', action: 'AR Scan completed', detail: '65m² in Sydney, NSW', time: '2 min ago', icon: '📐' },
    { id: '2', action: 'New booking confirmed', detail: 'Bond Clean — $289', time: '15 min ago', icon: '✅' },
    { id: '3', action: 'Payment received', detail: 'Strata Clean — $450', time: '1 hr ago', icon: '💰' },
    { id: '4', action: 'Quote generated', detail: '45m² Residential, VIC', time: '2 hr ago', icon: '📋' },
    { id: '5', action: 'Strata lead imported', detail: 'Sarah Chen — Strata Plus', time: '3 hr ago', icon: '👤' },
    { id: '6', action: 'CRO variant deployed', detail: 'CTA Blue → NSW homepage', time: '5 hr ago', icon: '🚀' },
  ];
}

// ── Sub-Components ─────────────────────────────────────────────────
function MetricCardComponent({ metric }: { metric: MetricCard }) {
  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{metric.icon}</span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${metric.positive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {metric.change}
        </span>
      </div>
      <div className="text-2xl font-bold text-white">{metric.value}</div>
      <div className="text-sm text-gray-400 mt-1">{metric.label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const styles = {
    confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Revenue Bar Chart (pure CSS) ───────────────────────────────────
function RevenueChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [3200, 4100, 3800, 5200, 4800, 2900, 3600];
  const max = Math.max(...values);

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Revenue This Week</h3>
      <div className="flex items-end gap-2 h-40">
        {days.map((day, i) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400">${(values[i] / 1000).toFixed(1)}k</span>
            <div
              className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t transition-all duration-500"
              style={{ height: `${(values[i] / max) * 100}%`, minHeight: '8px' }}
            />
            <span className="text-xs text-gray-500">{day}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm text-gray-400">
        Total: <span className="text-white font-semibold">${values.reduce((a, b) => a + b, 0).toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── Region Breakdown ───────────────────────────────────────────────
function RegionBreakdown() {
  const regionData = REGIONS.map((r) => ({
    code: r,
    bookings: Math.floor(Math.random() * 15 + 3),
    revenue: Math.floor(Math.random() * 8000 + 2000),
  })).sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = regionData[0].revenue;

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-gray-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Revenue by Region</h3>
      <div className="space-y-3">
        {regionData.map((r) => (
          <div key={r.code}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300 font-medium">{r.code}</span>
              <span className="text-gray-400">{r.bookings} bookings · ${r.revenue.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Simulate data load
    setMetrics(generateMetrics());
    setBookings(generateBookings());
    setActivity(generateActivity());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📊</div>
          <div className="text-white text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Bar */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧹</span>
            <div>
              <h1 className="text-xl font-bold">LuminaClean Dashboard</h1>
              <p className="text-xs text-gray-400">Welcome back — here&apos;s your overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/residential/ar-scanner"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              📐 AR Scanner
            </Link>
            <Link
              href="/admin/cro-control"
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              🎯 CRO
            </Link>
            <Link
              href="/"
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              🏠 Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <MetricCardComponent key={m.label} metric={m} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <RegionBreakdown />
        </div>

        {/* Bookings + Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bookings Table */}
          <div className="lg:col-span-2 bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
              <h3 className="font-semibold text-white">Recent Bookings</h3>
              <span className="text-xs text-gray-400">{bookings.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-2">ID</th>
                    <th className="text-left px-4 py-2">Type</th>
                    <th className="text-left px-4 py-2">Region</th>
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-left px-4 py-2">Area</th>
                    <th className="text-right px-4 py-2">Price</th>
                    <th className="text-center px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-t border-gray-700/30 hover:bg-gray-700/20 transition">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">{b.id}</td>
                      <td className="px-4 py-3 text-gray-200">{b.type}</td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-700 px-2 py-0.5 rounded text-xs">{b.region}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{b.date}</td>
                      <td className="px-4 py-3 text-gray-400">{b.area}m²</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-400">${b.price}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700/50">
              <h3 className="font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="divide-y divide-gray-700/30 max-h-[420px] overflow-y-auto">
              {activity.map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-700/20 transition">
                  <span className="text-xl flex-shrink-0">{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white font-medium">{a.action}</div>
                    <div className="text-xs text-gray-400 truncate">{a.detail}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'New Booking', icon: '➕', href: '/residential/ar-scanner', color: 'from-blue-600 to-blue-700' },
            { label: 'AR Scanner', icon: '📐', href: '/residential/ar-scanner', color: 'from-purple-600 to-purple-700' },
            { label: 'Strata Leads', icon: '👥', href: '/admin/cro-control', color: 'from-green-600 to-green-700' },
            { label: 'CRO Control', icon: '🎯', href: '/admin/cro-control', color: 'from-orange-600 to-orange-700' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`bg-gradient-to-br ${action.color} hover:opacity-90 text-white font-medium px-5 py-4 rounded-xl transition text-center`}
            >
              <div className="text-2xl mb-1">{action.icon}</div>
              <div className="text-sm">{action.label}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
