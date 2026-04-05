// SEO/AEO Schema.org components for LuminaClean v5.0
// Implements GEO entities, LocalBusiness, Service, and FAQ schemas

import { AUSTRALIAN_REGIONS, generateSEOMetadata } from '@/lib/australian-regions';

interface SEOProps {
  pageType?: 'home' | 'service' | 'location' | 'scanner' | 'dashboard';
  regionCode?: string;
  serviceType?: string;
}

// LocalBusiness Schema
function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'LuminaClean',
    image: 'https://lumina-clean.com.au/logo.png',
    url: 'https://lumina-clean.com.au',
    telephone: '1300-LUMINA',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AU',
      addressRegion: 'Australia',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -33.8688,
      longitude: 151.2093,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
    areaServed: Object.values(AUSTRALIAN_REGIONS).map(region => ({
      '@type': 'State',
      name: region.name,
    })),
    sameAs: [
      'https://facebook.com/luminaclean',
      'https://instagram.com/luminaclean',
      'https://linkedin.com/company/luminaclean',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Service Schema for cleaning services
function ServiceSchema({ serviceType = 'CleaningServices' }: { serviceType?: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType,
    provider: {
      '@type': 'Organization',
      name: 'LuminaClean',
      url: 'https://lumina-clean.com.au',
    },
    areaServed: Object.values(AUSTRALIAN_REGIONS).map(region => ({
      '@type': 'State',
      name: region.name,
    })),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'AUD',
      lowPrice: 109,
      highPrice: 500,
      offerCount: Object.keys(AUSTRALIAN_REGIONS).length,
    },
    serviceOutput: {
      '@type': 'ServiceOutput',
      name: 'Professional Cleaning Service',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Location-specific schema for GEO targeting
function LocationSchema({ regionCode }: { regionCode: string }) {
  const region = AUSTRALIAN_REGIONS[regionCode];
  if (!region) return null;

  const mainCity = region.cities[0];
  const mainPostcode = region.postcodeRanges[0][0];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `LuminaClean ${region.name}`,
    image: 'https://lumina-clean.com.au/logo.png',
    '@id': `https://lumina-clean.com.au/${regionCode.toLowerCase()}`,
    url: `https://lumina-clean.com.au/${regionCode.toLowerCase()}`,
    telephone: '1300-LUMINA',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: mainCity,
      addressRegion: regionCode,
      postalCode: String(mainPostcode),
      addressCountry: 'AU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: regionCode === 'NSW' ? -33.8688 : -37.8136,
      longitude: regionCode === 'NSW' ? 151.2093 : 144.9631,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '19:00',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// FAQ Schema for AEO (Answer Engine Optimization)
function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does bond cleaning cost in Sydney?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bond cleaning in Sydney typically costs between $149-$500 depending on property size. Use our AR scanner for an instant quote at lumina-clean.com.au/residential/ar-scanner.',
        },
      },
      {
        '@type': 'Question',
        name: 'What areas do you service in Australia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LuminaClean services all Australian states and territories: NSW, VIC, QLD, WA, SA, TAS, ACT, and NT. Regional pricing is available for major cities including Sydney, Melbourne, Brisbane, Perth, Adelaide, Hobart, Canberra, and Darwin.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get a cleaning quote?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can get an instant cleaning quote using our AR Room Scanner. Simply visit the scanner page, point your phone camera at the room, and receive a quote in 8 seconds. Manual entry is also available.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you offer strata cleaning services?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, LuminaClean offers comprehensive strata cleaning services across Australia. Contact us for bulk strata contracts and personalized quotes for your strata portfolio.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is LuminaClean insured and certified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, LuminaClean is fully insured and ISO-certified. All our cleaners are police-checked and trained to enterprise standards. We provide guarantees on all cleaning services.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// BreadcrumbList Schema
function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Main SEO Component
export function SEOSchema({ pageType, regionCode, serviceType }: SEOProps) {
  return (
    <>
      <LocalBusinessSchema />
      <ServiceSchema serviceType={serviceType} />
      <FAQSchema />
      {regionCode && <LocationSchema regionCode={regionCode} />}
    </>
  );
}

export { LocalBusinessSchema, ServiceSchema, LocationSchema, FAQSchema, BreadcrumbSchema };
export default SEOSchema;
