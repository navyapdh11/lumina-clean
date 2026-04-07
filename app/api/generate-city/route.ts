import { NextResponse } from 'next/server';
import { AUSTRALIAN_REGIONS } from '@/lib/australian-regions';

// Build Australian city list from canonical source
const AU_CITIES = Object.values(AUSTRALIAN_REGIONS).flatMap((r) =>
  r.cities.slice(0, 10).map((c) => ({ city: c, state: r.code, rate: r.baseRate, minPrice: r.minPrice }))
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cityName = searchParams.get('city');

    // If no city specified, return all available cities
    if (!cityName) {
      return NextResponse.json({
        cities: AU_CITIES.map((c) => ({ city: c.city, state: c.state })),
        total: AU_CITIES.length,
      });
    }

    // Find matching city (case-insensitive)
    const city = AU_CITIES.find(
      (c) => c.city.toLowerCase() === cityName.toLowerCase()
    );

    if (!city) {
      return NextResponse.json(
        { error: `City "${cityName}" not found. Available: ${AU_CITIES.slice(0, 5).map((c) => c.city).join(', ')}...` },
        { status: 404 }
      );
    }

    const content = {
      title: `Professional Cleaning Services ${city.city}, ${city.state} | LuminaClean`,
      metaDescription: `Enterprise cleaning in ${city.city}, ${city.state}. AR-powered quotes from $${city.minPrice}. Bond, strata, commercial & residential cleaning.`,
      faq: [
        {
          q: `How fast can I get a cleaning quote in ${city.city}?`,
          a: `Use our AR Room Scanner for an instant quote in 8 seconds. Standard pricing from $${city.rate}/m² in ${city.state}.`,
        },
        {
          q: `Do you serve all of ${city.city}?`,
          a: `Yes — we cover all suburbs and surrounding areas in ${city.city}, ${city.state}. Same-day service available.`,
        },
        {
          q: `What types of cleaning do you offer in ${city.city}?`,
          a: `Bond cleaning, end of lease, strata, commercial, residential, and Airbnb turnover services across ${city.state}.`,
        },
        {
          q: `Is LuminaClean insured in ${city.state}?`,
          a: `Yes — fully insured with public liability and workers compensation. ABN: 12 345 678 901.`,
        },
      ],
      stats: {
        retention: '98.7%',
        onTime: '99.2%',
        price: `$${city.rate}/m²`,
        minPrice: `$${city.minPrice}`,
      },
      region: {
        code: city.state,
        name: AUSTRALIAN_REGIONS[city.state as keyof typeof AUSTRALIAN_REGIONS]?.name || city.state,
        timezone: AUSTRALIAN_REGIONS[city.state as keyof typeof AUSTRALIAN_REGIONS]?.timezone || 'Australia/Sydney',
      },
    };

    return NextResponse.json(content);
  } catch {
    return NextResponse.json({ error: 'Failed to generate city content' }, { status: 500 });
  }
}
