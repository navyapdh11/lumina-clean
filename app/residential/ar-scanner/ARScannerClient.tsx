'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ARScanner = dynamic(() => import('@/components/ARScanner'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[500px] bg-gray-900 rounded-2xl animate-pulse flex items-center justify-center">
      <div className="text-white text-xl">Loading AR Scanner...</div>
    </div>
  ),
});

export default function ARScannerClient() {
  return (
    <Suspense fallback={<div className="text-white text-center py-20">Loading...</div>}>
      <ARScanner
        onQuoteGenerated={(quote) => {
          console.log('Quote generated:', quote);
          // Analytics event
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'ar_quote_generated', {
              area: quote.area,
              bedrooms: quote.bedrooms,
              price: quote.estimatedPrice,
              region: quote.region,
            });
          }
        }}
      />
    </Suspense>
  );
}
