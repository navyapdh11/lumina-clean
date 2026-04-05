import { NextResponse } from 'next/server';

const TOP_50_CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
  "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
  "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis",
  "Seattle", "Denver", "Washington", "Boston", "El Paso", "Nashville",
  "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville",
  "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento",
  "Kansas City", "Long Beach", "Mesa", "Atlanta", "Colorado Springs",
  "Virginia Beach", "Raleigh", "Omaha", "Miami", "Oakland", "Minneapolis",
  "Tulsa", "Wichita", "New Orleans", "Arlington"
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Austin';
  
  // Validate city (optional)
  if (!TOP_50_CITIES.includes(city)) {
    return NextResponse.json({ error: 'City not in top 50 list' }, { status: 400 });
  }
  
  const content = {
    title: `Enterprise Cleaning Services ${city} 2026 | LuminaClean`,
    metaDescription: `ISO-certified deep cleaning in ${city}. 3D AR tours, AI quotes, same-day service. 98.7% retention.`,
    faq: [
      { q: `How fast is office cleaning in ${city}?`, a: '4–6 hours for 10,000 sq ft with robotic pre-scrub.' },
      { q: `Do you serve all of ${city}?`, a: `Yes, we cover all commercial zones in ${city} and surrounding metro.` },
      { q: `What certifications do your cleaners hold?`, a: 'All staff are IICRC certified and background checked.' },
    ],
    stats: { retention: '98.7%', onTime: '99.2%', price: '$2.89–$4.20/sq ft' }
  };
  
  return NextResponse.json(content);
}
