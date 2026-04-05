'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [cleanMessage, setCleanMessage] = useState('');

  // Fun animation on mount
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { setIsVisible(true); }, []);

  return (
    <main className={`min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hero Section */}
      <section className="relative w-full min-h-[600px] flex flex-col items-center justify-center px-4 py-20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Hero content */}
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

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/residential/ar-scanner"
              className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none text-white font-semibold py-4 px-8 rounded-lg transition transform hover:scale-105"
            >
              📐 Try AR Scanner
            </Link>
            <Link
              href="/dashboard"
              className="bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none text-white font-semibold py-4 px-8 rounded-lg transition border border-white/20"
            >
              Client Dashboard
            </Link>
          </div>

          {cleanMessage && (
            <div className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg inline-block">
              {cleanMessage}
            </div>
          )}
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
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-white mb-3">52k+ Strata Leads</h3>
            <p className="text-gray-400">Enterprise LinkedIn scraper with deduplication. All states covered.</p>
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
              <div className="text-3xl font-bold text-blue-400">52k+</div>
              <div className="text-gray-400 text-sm mt-1">Strata Leads</div>
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
  );
}
