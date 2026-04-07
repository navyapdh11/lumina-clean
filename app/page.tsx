'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Sticky Header with AI Dashboard tab
function StickyHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const h = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lc_auth_token') : null;
    setIsAuthenticated(!!token);
  }, []);

  const navItems = [
    { href: '/residential/ar-scanner', label: 'AR Scanner' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/admin/cro-control', label: 'CRO Control' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-gray-900/95 backdrop-blur-md shadow-xl py-3' : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🧹</span>
            Lumina<span className="text-blue-400">Clean</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}

            {/* AI Dashboard Tab — Protected */}
            <Link
              href="/ai-dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-all"
            >
              <span>🧠</span>
              AI Dashboard
            </Link>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem('lc_auth_token');
                  window.location.reload();
                }}
                className="text-gray-400 hover:text-white text-sm transition"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-gray-900/98 backdrop-blur-lg border-t border-gray-800 py-4 px-4">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-gray-300 hover:text-white py-2"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/ai-dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-medium"
              >
                🧠 AI Dashboard
              </Link>
            </nav>
          </div>
        )}
      </header>
      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { setIsVisible(true); }, []);

  return (
    <div className={`transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <StickyHeader />

      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900">
        {/* Hero Section */}
        <section className="relative w-full min-h-[600px] flex flex-col items-center justify-center px-4 py-20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <div className="text-6xl mb-6">🧹✨</div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Clean offices.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Immersive previews.
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Australia&apos;s #1 enterprise cleaning platform. AR-powered quotes in 8 seconds. Serving all states.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/residential/ar-scanner"
                className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none text-white font-semibold py-4 px-8 rounded-lg transition transform hover:scale-105"
              >
                📐 Try AR Scanner
              </Link>
              <Link
                href="/ai-dashboard"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-2 focus:ring-purple-400 focus:outline-none text-white font-semibold py-4 px-8 rounded-lg transition transform hover:scale-105 flex items-center gap-2"
              >
                🧠 AI Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none text-white font-semibold py-4 px-8 rounded-lg transition border border-white/20"
              >
                Client Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16 max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why LuminaClean?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-8 border border-gray-700 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">📐</div>
              <h3 className="text-xl font-semibold text-white mb-3">AR Room Scanner</h3>
              <p className="text-gray-400">Point your camera, get instant quotes. 98% accuracy across all Australian regions.</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-8 border border-gray-700 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-white mb-3">AI-Powered UX Analysis</h3>
              <p className="text-gray-400">Self-reflecting AI agents with MCP protocol. Graph-of-Thoughts reasoning and real-time optimization.</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-8 border border-gray-700 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">🇦🇺</div>
              <h3 className="text-xl font-semibold text-white mb-3">All Australia</h3>
              <p className="text-gray-400">NSW, VIC, QLD, WA, SA, TAS, ACT, NT. Regional pricing, local service.</p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-800/30 py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-400">98.7%</div>
                <div className="text-gray-400 text-sm mt-1">Enterprise Grade</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">0.8s</div>
                <div className="text-gray-400 text-sm mt-1">AR Load Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">GoT + MCP</div>
                <div className="text-gray-400 text-sm mt-1">Self-Reflecting AI</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">12k+</div>
                <div className="text-gray-400 text-sm mt-1">Happy Customers</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-20 text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your cleaning business?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of satisfied customers. 58% book immediately after AR scan.
          </p>
          <Link
            href="/residential/ar-scanner"
            className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-10 rounded-lg transition transform hover:scale-105"
          >
            Get Started Now →
          </Link>
        </section>
      </main>
    </div>
  );
}
