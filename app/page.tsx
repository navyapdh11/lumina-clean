'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useState } from 'react';

const OfficeScene = dynamic(() => import('@/components/OfficeScene'), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-gray-900 animate-pulse" />
});

export default function HomePage() {
  const [cleanMessage, setCleanMessage] = useState('');

  return (
    <main className="min-h-screen">
      {/* Hero with 3D scene */}
      <section className="relative w-full h-[600px]">
        <OfficeScene onCleanComplete={() => setCleanMessage('✨ Your virtual office is now spotless!')} />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white text-center drop-shadow-2xl">
            Clean offices.<br />Immersive previews.
          </h1>
        </div>
        {cleanMessage && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
            {cleanMessage}
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="flex justify-center gap-4 py-12">
        <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition">
          Client Dashboard
        </Link>
        <button className="bg-white text-black font-semibold py-3 px-8 rounded-lg hover:bg-gray-200 transition">
          Get Quote
        </button>
      </div>
    </main>
  );
}
