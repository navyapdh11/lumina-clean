// Comprehensive Australian regions data for LuminaClean v5.0
// Covers all 8 states/territories with major cities, postcodes, and pricing

export interface AustralianRegion {
  code: string;
  name: string;
  cities: string[];
  postcodeRanges: [number, number][];
  baseRate: number; // AUD per square meter
  minPrice: number; // Minimum service price
  timezone: string;
}

export const AUSTRALIAN_REGIONS: Record<string, AustralianRegion> = {
  NSW: {
    code: 'NSW',
    name: 'New South Wales',
    cities: [
      'Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Coffs Harbour',
      'Tamworth', 'Albury', 'Wagga Wagga', 'Port Macquarie', 'Bathurst',
      'Lismore', 'Dubbo', 'Nowra', 'Queanbeyan', 'Armidale',
      'Orange', 'Broken Hill', 'Grafton', 'Singleton', 'Maitland',
    ],
    postcodeRanges: [[1000, 2599], [2619, 2899], [2921, 2999]],
    baseRate: 2.89,
    minPrice: 149,
    timezone: 'Australia/Sydney',
  },
  VIC: {
    code: 'VIC',
    name: 'Victoria',
    cities: [
      'Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton',
      'Mildura', 'Warrnambool', 'Wodonga', 'Traralgon', 'Horsham',
      'Sale', 'Morwell', 'Melton', 'Sunbury', 'Cranbourne',
      'Frankston', 'Dandenong', 'Werribee', 'Williamstown', 'Richmond',
    ],
    postcodeRanges: [[3000, 3999], [8000, 8999]],
    baseRate: 2.79,
    minPrice: 139,
    timezone: 'Australia/Melbourne',
  },
  QLD: {
    code: 'QLD',
    name: 'Queensland',
    cities: [
      'Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville', 'Cairns',
      'Toowoomba', 'Rockhampton', 'Mackay', 'Bundaberg', 'Hervey Bay',
      'Gladstone', 'Maryborough', 'Mount Isa', 'Ipswich', 'Logan City',
      'Redcliffe', 'Caloundra', 'Noosa', 'Maroochydore', 'Southport',
    ],
    postcodeRanges: [[4000, 4999], [9000, 9999]],
    baseRate: 2.69,
    minPrice: 129,
    timezone: 'Australia/Brisbane',
  },
  WA: {
    code: 'WA',
    name: 'Western Australia',
    cities: [
      'Perth', 'Fremantle', 'Joondalup', 'Rockingham', 'Mandurah',
      'Bunbury', 'Geraldton', 'Kalgoorlie', 'Albany', 'Busselton',
      'Broome', 'Port Hedland', 'Karratha', 'Carnarvon', 'Esperance',
      'Armadale', 'Rockingham', 'Midland', 'Morley', 'Balga',
    ],
    postcodeRanges: [[6000, 6799]],
    baseRate: 2.99,
    minPrice: 159,
    timezone: 'Australia/Perth',
  },
  SA: {
    code: 'SA',
    name: 'South Australia',
    cities: [
      'Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge', 'Port Augusta',
      'Port Lincoln', 'Port Pirie', 'Victor Harbor', 'Gawler', 'Mount Barker',
      'Salisbury', 'Elizabeth', 'Tea Tree Gully', 'Marion', 'Noarlunga',
      'Christies Beach', 'Aldinga', 'McLaren Vale', 'Tanunda', 'Nuriootpa',
    ],
    postcodeRanges: [[5000, 5799], [5900, 5999]],
    baseRate: 2.59,
    minPrice: 119,
    timezone: 'Australia/Adelaide',
  },
  TAS: {
    code: 'TAS',
    name: 'Tasmania',
    cities: [
      'Hobart', 'Launceston', 'Devonport', 'Burnie', 'Ulverstone',
      'Somerset', 'Wynyard', 'Smithton', 'Queenstown', 'Zeehan',
      'St Helens', 'Swansea', 'Triabunna', 'Oatlands', 'Ross',
      'New Norfolk', 'Brighton', 'Claremont', 'Kingston', 'Margate',
    ],
    postcodeRanges: [[7000, 7799]],
    baseRate: 2.49,
    minPrice: 109,
    timezone: 'Australia/Hobart',
  },
  ACT: {
    code: 'ACT',
    name: 'Australian Capital Territory',
    cities: ['Canberra', 'Belconnen', 'Woden', 'Tuggeranong', 'Gungahlin', ' Weston Creek', 'Molonglo Valley'],
    postcodeRanges: [[200, 299], [2600, 2618], [2900, 2920]],
    baseRate: 3.09,
    minPrice: 169,
    timezone: 'Australia/Sydney',
  },
  NT: {
    code: 'NT',
    name: 'Northern Territory',
    cities: ['Darwin', 'Palmerston', 'Alice Springs', 'Katherine', 'Nhulunbuy', 'Tennant Creek', 'Casuarina', 'Nightcliff', 'Jingili', 'Bakewell'],
    postcodeRanges: [[800, 899], [900, 999], [8000, 8099], [850, 859]],
    baseRate: 3.19,
    minPrice: 179,
    timezone: 'Australia/Darwin',
  },
} as const;

// Helper: Get region by postcode
export function getRegionByPostcode(postcode: number): AustralianRegion | null {
  for (const region of Object.values(AUSTRALIAN_REGIONS)) {
    for (const [start, end] of region.postcodeRanges) {
      if (postcode >= start && postcode <= end) {
        return region;
      }
    }
  }
  return null;
}

// Helper: Calculate price based on area and region
export function calculatePrice(area: number, regionCode: string): { price: number; rate: number; region: string } {
  const region = AUSTRALIAN_REGIONS[regionCode];
  if (!region) {
    // Default to NSW pricing
    const defaultRegion = AUSTRALIAN_REGIONS.NSW;
    const price = Math.max(defaultRegion.minPrice, Math.round(area * defaultRegion.baseRate));
    return { price, rate: defaultRegion.baseRate, region: defaultRegion.code };
  }
  
  const price = Math.max(region.minPrice, Math.round(area * region.baseRate));
  return { price, rate: region.baseRate, region: region.code };
}

// Helper: Get all cities flat list
export function getAllAustralianCities(): { city: string; state: string; postcode: string }[] {
  const cities: { city: string; state: string; postcode: string }[] = [];
  
  for (const region of Object.values(AUSTRALIAN_REGIONS)) {
    for (const city of region.cities) {
      const mainPostcode = region.postcodeRanges[0][0];
      cities.push({
        city,
        state: region.code,
        postcode: String(mainPostcode),
      });
    }
  }
  
  return cities.sort((a, b) => a.city.localeCompare(b.city));
}

// Helper: Get region by coordinates (simplified)
export function getRegionByCoordinates(lat: number, lng: number): AustralianRegion | null {
  if (lat > -34 && lat < -28 && lng > 150 && lng < 154) return AUSTRALIAN_REGIONS.NSW;
  if (lat > -39 && lat < -34 && lng > 140 && lng < 150) return AUSTRALIAN_REGIONS.VIC;
  if (lat > -29 && lat < -10 && lng > 137 && lng < 154) return AUSTRALIAN_REGIONS.QLD;
  if (lat > -35 && lat < -13 && lng > 112 && lng < 130) return AUSTRALIAN_REGIONS.WA;
  if (lat > -38 && lat < -28 && lng > 129 && lng < 141) return AUSTRALIAN_REGIONS.SA;
  if (lat > -44 && lat < -39 && lng > 143 && lng < 149) return AUSTRALIAN_REGIONS.TAS;
  if (lat > -36 && lat < -34 && lng > 148 && lng < 150) return AUSTRALIAN_REGIONS.ACT;
  if (lat > -26 && lat < -10 && lng > 129 && lng < 138) return AUSTRALIAN_REGIONS.NT;
  return null;
}

// SEO/AEO: Generate location-based keywords
export function generateSEOMetadata(regionCode: string): { title: string; description: string; keywords: string[] } {
  const region = AUSTRALIAN_REGIONS[regionCode];
  if (!region) {
    return {
      title: 'LuminaClean | Professional Cleaning Services Australia',
      description: 'Enterprise cleaning services across Australia. AR-powered quotes in 8 seconds.',
      keywords: ['cleaning services', 'Australia', 'bond cleaning', 'strata cleaning'],
    };
  }

  const mainCity = region.cities[0];
  const mainPostcode = region.postcodeRanges[0][0];

  return {
    title: `LuminaClean | Cleaning Services ${mainCity} & ${region.name}`,
    description: `Professional cleaning services in ${region.name}. Instant AR quotes for ${mainCity} ${mainPostcode}. Bond, strata, commercial & residential cleaning.`,
    keywords: [
      `cleaning services ${mainCity}`,
      `bond cleaning ${region.code}`,
      `strata cleaning ${mainPostcode}`,
      `cleaning ${region.name}`,
      'end of lease cleaning',
      'commercial cleaning',
      'residential cleaning',
      'LuminaClean Australia',
    ],
  };
}

export default AUSTRALIAN_REGIONS;
