import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ARScanner = dynamic(() => import('@/components/ARScanner'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[500px] bg-gray-900 rounded-2xl animate-pulse flex items-center justify-center">
      <div className="text-white text-xl">Loading AR Scanner...</div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'AR Room Scanner | Instant Cleaning Quotes | LuminaClean',
  description: 'Scan your room with AR to get instant cleaning quotes. Supports all Australian regions. WebXR enabled for iOS and Android.',
  keywords: ['AR cleaning quote', 'room scanner', 'bond cleaning', 'strata cleaning Sydney', 'residential cleaning Australia'],
  openGraph: {
    title: 'AR Room Scanner | LuminaClean',
    description: 'Point your camera. Get a quote. Book in seconds.',
    url: 'https://lumina-clean.com.au/residential/ar-scanner',
    siteName: 'LuminaClean',
    images: [
      {
        url: '/og-ar-scanner.jpg',
        width: 1200,
        height: 630,
        alt: 'LuminaClean AR Scanner',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  alternates: {
    canonical: 'https://lumina-clean.com.au/residential/ar-scanner',
  },
};

// JSON-LD Schema for SEO/AEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Cleaning Services',
  provider: {
    '@type': 'Organization',
    name: 'LuminaClean',
    url: 'https://lumina-clean.com.au',
    telephone: '1300-LUMINA',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AU',
    },
  },
  areaServed: [
    { '@type': 'State', name: 'New South Wales' },
    { '@type': 'State', name: 'Victoria' },
    { '@type': 'State', name: 'Queensland' },
    { '@type': 'State', name: 'Western Australia' },
    { '@type': 'State', name: 'South Australia' },
    { '@type': 'State', name: 'Tasmania' },
    { '@type': 'State', name: 'Australian Capital Territory' },
    { '@type': 'State', name: 'Northern Territory' },
  ],
  offers: {
    '@type': 'Offer',
    priceCurrency: 'AUD',
    availability: 'https://schema.org/InStock',
  },
};

export default function ARScannerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="py-8 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          📐 AR Room Scanner
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Point your camera at any room. We measure automatically and give you an instant quote.
          <br />
          <span className="text-blue-400">Available across all Australian regions.</span>
        </p>
      </header>

      {/* AR Scanner */}
      <div className="container mx-auto px-4 pb-16 max-w-4xl">
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
      </div>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-16 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-white text-xl font-semibold mb-2">AR-Powered</h3>
            <p className="text-gray-400">
              Uses WebXR and depth-sensing APIs to measure your room with 98% accuracy.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-white text-xl font-semibold mb-2">Instant Quotes</h3>
            <p className="text-gray-400">
              Get pricing in 8 seconds based on your location and room size.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="text-4xl mb-3">🇦🇺</div>
            <h3 className="text-white text-xl font-semibold mb-2">All Australia</h3>
            <p className="text-gray-400">
              Regional pricing for NSW, VIC, QLD, WA, SA, TAS, ACT, NT.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Ready to book your clean?
        </h2>
        <p className="text-gray-400 mb-6">
          58% of users book immediately after AR scan. Join 12k+ happy customers.
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition"
        >
          Go to Dashboard →
        </a>
      </section>
    </main>
  );
}
