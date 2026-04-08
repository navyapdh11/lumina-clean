'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════
interface Metric { label: string; value: string; change: string; positive: boolean; icon: string }
interface Booking { id: string; region: string; type: string; date: string; status: string; price: number; area: number }
interface Activity { action: string; detail: string; time: string; icon: string }

// ═══════════════════════════════════════════════════════════
// Sticky Nav
// ═══════════════════════════════════════════════════════════
function DashNav() {
  return (
    <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm shadow-lg shadow-blue-500/25">🧹</div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">LuminaClean</h1>
            <p className="text-[11px] text-gray-500 -mt-0.5">Client Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/residential/ar-scanner" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition">
            📐 AR Scanner
          </Link>
          <Link href="/ai-dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-600/10 border border-blue-500/20 px-3 py-2 rounded-xl hover:bg-blue-600/20 transition">
            🧠 AI Dashboard
          </Link>
          <Link href="/" className="text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition">
            🏠 Home
          </Link>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
// Metric Card
// ═══════════════════════════════════════════════════════════
function MetricCard({ m }: { m: Metric }) {
  return (
    <div className="group relative bg-gray-900/60 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/5 hover:border-blue-500/30 transition-all duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{m.icon}</span>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${m.positive ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20'}`}>
            {m.change}
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{m.value}</div>
        <div className="text-sm text-gray-400 mt-1.5 font-medium">{m.label}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Revenue Chart
// ═══════════════════════════════════════════════════════════
function RevenueChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [3200, 4100, 3800, 5200, 4800, 2900, 3600];
  const max = Math.max(...values);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 p-5 sm:p-6">
      <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        Revenue This Week
      </h3>
      <div className="flex items-end gap-2 sm:gap-3 h-36 sm:h-44">
        {days.map((day, i) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
            <span className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-300 transition-colors">${(values[i] / 1000).toFixed(1)}k</span>
            <div
              className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all duration-700 group-hover:from-blue-500 group-hover:to-cyan-300"
              style={{ height: `${(values[i] / max) * 100}%`, minHeight: '6px' }}
            />
            <span className="text-[10px] sm:text-xs text-gray-500 group-hover:text-white transition-colors">{day}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-white/5 text-sm text-gray-400">
        Total: <span className="text-white font-bold text-lg">${total.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Region Bars
// ═══════════════════════════════════════════════════════════
function RegionBreakdown() {
  const data = useMemo(() => {
    return ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map((r) => ({
      code: r, revenue: Math.floor(Math.random() * 8000 + 2000),
    })).sort((a, b) => b.revenue - a.revenue);
  }, []);
  const mx = data[0]?.revenue || 1;

  return (
    <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 p-5 sm:p-6">
      <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        Revenue by Region
      </h3>
      <div className="space-y-3">
        {data.map((r) => (
          <div key={r.code}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-300 font-semibold">{r.code}</span>
              <span className="text-gray-500">{r.revenue.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${(r.revenue / mx) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMetrics([
      { label: 'Total Revenue', value: '$48,350', change: '+12.5%', positive: true, icon: '💰' },
      { label: 'Active Bookings', value: '23', change: '+5 this week', positive: true, icon: '📅' },
      { label: 'AR Scans Today', value: '147', change: '+18%', positive: true, icon: '📐' },
      { label: 'Conversion Rate', value: '4.8%', change: '-0.3%', positive: false, icon: '📊' },
    ]);
    setBookings(
      Array.from({ length: 8 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return {
          id: `BK-${1000 + i}`, region: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'][i],
          type: ['Bond Clean', 'Strata Clean', 'Commercial', 'Residential', 'End of Lease', 'Office Clean', 'Deep Clean', 'Regular'][i],
          date: d.toISOString().split('T')[0],
          status: ['confirmed', 'pending', 'completed', 'confirmed', 'pending', 'completed', 'confirmed', 'pending'][i],
          price: Math.floor(Math.random() * 300 + 150),
          area: Math.floor(Math.random() * 80 + 30),
        };
      })
    );
    setActivity([
      { action: 'AR Scan completed', detail: '65m² in Sydney, NSW', time: '2 min ago', icon: '📐' },
      { action: 'Booking confirmed', detail: 'Bond Clean — $289', time: '15 min ago', icon: '✅' },
      { action: 'Payment received', detail: 'Strata Clean — $450', time: '1 hr ago', icon: '💰' },
      { action: 'Quote generated', detail: '45m² Residential, VIC', time: '2 hr ago', icon: '📋' },
      { action: 'Lead imported', detail: 'Sarah Chen — Strata Plus', time: '3 hr ago', icon: '👤' },
      { action: 'CRO deployed', detail: 'CTA Blue → NSW', time: '5 hr ago', icon: '🚀' },
    ]);
    setLoaded(true);
  }, []);

  if (!loaded) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse shadow-2xl shadow-blue-500/25">📊</div>
        <p className="text-white text-lg font-medium">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <DashNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {metrics.map((m) => <MetricCard key={m.label} m={m} />)}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RevenueChart />
          <RegionBreakdown />
        </div>

        {/* Bookings + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Table */}
          <div className="lg:col-span-2 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white">Recent Bookings</h3>
              <span className="text-xs text-gray-500">{bookings.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 sm:px-6 py-3 font-medium">ID</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Region</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium">Price</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                      <td className="px-4 sm:px-6 py-3 font-mono text-xs text-blue-400">{b.id}</td>
                      <td className="px-4 py-3 text-gray-300 hidden sm:table-cell text-xs">{b.type}</td>
                      <td className="px-4 py-3"><span className="bg-white/5 px-2 py-0.5 rounded text-xs font-medium">{b.region}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{b.date}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">${b.price}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          b.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400' :
                          b.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-blue-500/15 text-blue-400'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-white">Activity Feed</h3>
            </div>
            <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
              {activity.map((a, i) => (
                <div key={i} className="px-5 sm:px-6 py-3.5 flex items-start gap-3 hover:bg-white/[0.02] transition">
                  <span className="text-lg flex-shrink-0 mt-0.5">{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{a.action}</p>
                    <p className="text-xs text-gray-500 truncate">{a.detail}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'New Booking', icon: '➕', href: '/residential/ar-scanner', g: 'from-blue-600 to-blue-700' },
            { label: 'AR Scanner', icon: '📐', href: '/residential/ar-scanner', g: 'from-purple-600 to-purple-700' },
            { label: 'AI Dashboard', icon: '🧠', href: '/ai-dashboard', g: 'from-emerald-600 to-emerald-700' },
            { label: 'CRO Control', icon: '🎯', href: '/admin/cro-control', g: 'from-orange-600 to-orange-700' },
          ].map((a) => (
            <Link key={a.label} href={a.href} className={`bg-gradient-to-br ${a.g} hover:opacity-90 text-white font-semibold px-5 py-5 rounded-2xl transition text-center hover:-translate-y-0.5 shadow-lg`}>
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-sm">{a.label}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
