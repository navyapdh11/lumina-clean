import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'LuminaClean | Enterprise Cleaning Services Australia • AR Quotes',
    template: '%s | LuminaClean Australia',
  },
  description: 'Australia\'s #1 enterprise cleaning platform. AR room scanning, instant quotes, 52k+ strata leads. Bond, commercial, strata & residential cleaning across all Australian states.',
  keywords: ['cleaning services Australia', 'bond cleaning', 'strata cleaning', 'AR cleaning quote', 'commercial cleaning', 'end of lease cleaning', 'LuminaClean'],
  authors: [{ name: 'LuminaClean' }],
  creator: 'LuminaClean',
  publisher: 'LuminaClean',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://lumina-clean.com.au'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LuminaClean | Enterprise Cleaning Australia',
    description: 'AR-powered cleaning quotes in 8 seconds. Serving all Australian states.',
    url: 'https://lumina-clean.com.au',
    siteName: 'LuminaClean',
    locale: 'en_AU',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: { 
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU" className="dark">
      <body className="antialiased" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded">
          Skip to main content
        </a>
        <main id="main-content" role="main">
          {children}
        </main>
        {/* Footer with accessibility info */}
        <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm" role="contentinfo">
          <p>© 2026 LuminaClean. Enterprise Cleaning Services Australia. All rights reserved.</p>
          <p className="mt-2">ABN: 12 345 678 901 | 1300-LUMINA | WCAG 2.2 AA Compliant</p>
        </footer>

        {/* Inline JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'LuminaClean',
              telephone: '1300-LUMINA',
              address: { '@type': 'PostalAddress', addressCountry: 'AU' },
              areaServed: [
                { '@type': 'State', name: 'New South Wales' },
                { '@type': 'State', name: 'Victoria' },
                { '@type': 'State', name: 'Queensland' },
                { '@type': 'State', name: 'Western Australia' },
                { '@type': 'State', name: 'South Australia' },
                { '@type': 'State', name: 'Tasmania' },
                { '@type': 'State', name: 'ACT' },
                { '@type': 'State', name: 'Northern Territory' },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
