'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ARScanner = dynamic(() => import('@/components/ARScanner'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[500px] bg-gray-900/50 rounded-2xl animate-pulse flex items-center justify-center border border-white/5">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">📐</div>
        <div className="text-white text-lg font-medium">Loading AR Scanner…</div>
      </div>
    </div>
  ),
});

export default function ARScannerClient() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
      <ARScanner onQuoteGenerated={(q) => {
        console.log('Quote:', q);
      }} />
    </Suspense>
  );
}
