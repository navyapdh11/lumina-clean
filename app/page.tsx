'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════
// Sticky Header — responsive, animated, accessible
// ═══════════════════════════════════════════════════════════
function StickyHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    setHasSession(
      typeof document !== 'undefined' &&
      (document.cookie.includes('lc_session=') ||
        document.cookie.includes('__session='))
    );
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-gray-950/90 backdrop-blur-xl shadow-2xl shadow-black/20 border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              🧹
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Lumina<span className="text-blue-400">Clean</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {[
              { href: '/', label: 'Home' },
              { href: '/residential/ar-scanner', label: 'AR Scanner' },
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/admin/cro-control', label: 'CRO' },
              { href: '/ai-dashboard', label: 'AI Dashboard', accent: true },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.accent
                    ? 'ml-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {!hasSession ? (
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40"
              >
                Get Started
              </Link>
            ) : (
              <button
                onClick={() => {
                  document.cookie = 'lc_session=; path=/; max-age=0';
                  document.cookie = 'lc_role=; path=/; max-age=0';
                  window.location.reload();
                }}
                className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden absolute top-full inset-x-0 bg-gray-950/98 backdrop-blur-2xl border-t border-white/5 shadow-2xl">
            <nav className="flex flex-col gap-1 p-4 max-w-sm mx-auto" aria-label="Mobile navigation">
              {[
                { href: '/', label: 'Home' },
                { href: '/residential/ar-scanner', label: 'AR Scanner' },
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/admin/cro-control', label: 'CRO Control' },
                { href: '/ai-dashboard', label: 'AI Dashboard' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-base font-medium text-gray-300 hover:text-white py-3 px-4 rounded-xl hover:bg-white/5 transition"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      <div className="h-16 sm:h-20" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Animated counter hook
// ═══════════════════════════════════════════════════════════
function useCountUp(target: number, duration = 2000, startOnView = true) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView || !ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const inc = target / steps;
        let cur = 0;
        const id = setInterval(() => {
          cur += inc;
          if (cur >= target) { setVal(target); clearInterval(id); }
          else setVal(Math.round(cur));
        }, duration / steps);
      }
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration, startOnView]);

  return { val, ref };
}

// ═══════════════════════════════════════════════════════════
// Stat Counter
// ═══════════════════════════════════════════════════════════
function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { val, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center group">
      <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
        {val.toLocaleString()}<span className="text-blue-400">{suffix}</span>
      </div>
      <div className="text-sm text-gray-400 mt-2 font-medium">{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Service Card
// ═══════════════════════════════════════════════════════════
function ServiceCard({ icon, title, desc, href, gradient }: {
  icon: string; title: string; desc: string; href: string; gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden hover:-translate-y-1"
    >
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-3xl mb-5 transition-all duration-300 group-hover:scale-110">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">{desc}</p>
        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
          Learn more
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════
export default function HomePage() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  return (
    <div className={`min-h-screen bg-[#050505] text-white transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
      <StickyHeader />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-32 pb-24 sm:pb-36 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-blue-400">v5.0 — Now with AI Dashboard</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-8">
            <span className="block">Clean spaces.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
              Powered by AI.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Australia&apos;s most advanced cleaning platform. AR-powered quotes in 8 seconds,
            self-reflecting AI optimization, and enterprise-grade service across all 8 states.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/residential/ar-scanner"
              className="group relative bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                📐 Try AR Scanner
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/ai-dashboard"
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                🧠 AI Dashboard
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                Client Dashboard
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={98.7} suffix="%" label="Enterprise Score" />
            <StatCounter value={12} suffix="k+" label="Happy Customers" />
            <StatCounter value={8} suffix="" label="Australian States" />
            <StatCounter value={0.8} suffix="s" label="AR Quote Speed" />
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Enterprise Cleaning Services
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From bond cleans to strata management — AI-optimized, AR-quoted, delivered with precision.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCard
            icon="🏡"
            title="Residential Cleaning"
            desc="End-of-lease, bond, and regular home cleaning with AR-powered instant quotes."
            href="/residential/ar-scanner"
            gradient="bg-gradient-to-br from-blue-600/20 to-cyan-600/20"
          />
          <ServiceCard
            icon="🏢"
            title="Commercial Cleaning"
            desc="Enterprise office cleaning with MCTS-optimized scheduling and quality assurance."
            href="/admin/cro-control"
            gradient="bg-gradient-to-br from-purple-600/20 to-pink-600/20"
          />
          <ServiceCard
            icon="🧠"
            title="AI UX Optimization"
            desc="Self-reflecting AI agents with MCP protocol. GoT reasoning and real-time analytics."
            href="/ai-dashboard"
            gradient="bg-gradient-to-br from-emerald-600/20 to-teal-600/20"
          />
          <ServiceCard
            icon="♿"
            title="NDIS & Strata"
            desc="Specialized cleaning for disability support and strata-managed properties."
            href="/dashboard"
            gradient="bg-gradient-to-br from-amber-600/20 to-orange-600/20"
          />
          <ServiceCard
            icon="🔬"
            title="AR Room Scanner"
            desc="Scan any room in 3D. Get instant, accurate quotes based on real dimensions."
            href="/residential/ar-scanner"
            gradient="bg-gradient-to-br from-indigo-600/20 to-blue-600/20"
          />
          <ServiceCard
            icon="📊"
            title="CRO Optimization"
            desc="Conversion rate optimization with Monte Carlo Tree Search across all regions."
            href="/admin/cro-control"
            gradient="bg-gradient-to-br from-rose-600/20 to-red-600/20"
          />
        </div>
      </section>

      {/* ── WHY LUMINACLEAN ──────────────────────────────── */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Why Choose LuminaClean?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🔒', title: 'Enterprise Security', desc: 'OWASP-compliant, RBAC-protected, audit-ready infrastructure.' },
              { icon: '⚡', title: 'Lightning Fast', desc: '0.8s AR load time. 120ms API response. 96 Lighthouse score.' },
              { icon: '🇦🇺', title: 'All Australia', desc: 'NSW, VIC, QLD, WA, SA, TAS, ACT, NT. Regional pricing.' },
              { icon: '🧠', title: 'AI-Powered', desc: 'GoT reasoning, MCP protocol, self-reflecting optimization.' },
            ].map((item) => (
              <div key={item.title} className="text-center group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="relative bg-gradient-to-br from-blue-600/20 via-blue-900/20 to-cyan-600/20 rounded-[2rem] border border-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_60%)]" />
          <div className="relative z-10 text-center px-6 py-20 sm:py-28">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Ready to Transform Your Space?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
              Join 12,000+ customers. 58% book immediately after their AR scan.
            </p>
            <Link
              href="/residential/ar-scanner"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Get Started Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm">🧹</div>
                <span className="font-bold text-white">LuminaClean</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Australia&apos;s #1 enterprise cleaning platform. AR-powered quotes, AI-optimized service.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/residential/ar-scanner" className="hover:text-white transition">Residential</Link></li>
                <li><Link href="/admin/cro-control" className="hover:text-white transition">Commercial</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Strata & NDIS</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/ai-dashboard" className="hover:text-white transition">AI Dashboard</Link></li>
                <li><Link href="/admin/cro-control" className="hover:text-white transition">CRO Control</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Client Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="tel:1300586462" className="hover:text-white transition">1300-LUMINA</a></li>
                <li>ABN: 12 345 678 901</li>
                <li>Sydney, Australia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2026 LuminaClean. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">
              WCAG 2.2 AA Compliant • OWASP Secured • 98.7% Enterprise Score
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
