// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';

// Australian pricing data by region
const PRICING_DATA: Record<string, { baseRate: number; minPrice: number }> = {
  NSW: { baseRate: 2.89, minPrice: 149 },
  VIC: { baseRate: 2.79, minPrice: 139 },
  QLD: { baseRate: 2.69, minPrice: 129 },
  WA: { baseRate: 2.99, minPrice: 159 },
  SA: { baseRate: 2.59, minPrice: 119 },
  TAS: { baseRate: 2.49, minPrice: 109 },
  ACT: { baseRate: 3.09, minPrice: 169 },
  NT: { baseRate: 3.19, minPrice: 179 },
};

interface RoomMeasurement {
  area: number;
  bedrooms: number;
  estimatedPrice: number;
  region: string;
}

// Manual Entry Form (works on all devices)
function ManualEntryForm({ onQuoteGenerated, userRegion }: { onQuoteGenerated?: (q: any) => void; userRegion: string }) {
  const [area, setArea] = useState('65');
  const [bedrooms, setBedrooms] = useState('2');
  const [quote, setQuote] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pricing = PRICING_DATA[userRegion] || PRICING_DATA.NSW;
    const areaNum = parseFloat(area) || 65;
    const bedNum = parseInt(bedrooms) || 2;
    const estimatedPrice = Math.max(pricing.minPrice, Math.round(areaNum * pricing.baseRate));

    const result = {
      area: areaNum,
      bedrooms: bedNum,
      estimatedPrice,
      region: userRegion,
      timestamp: new Date(),
    };

    setQuote(result);
    onQuoteGenerated?.(result);
  };

  if (quote) {
    return (
      <div className="w-full bg-gradient-to-br from-green-900 to-green-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="text-green-400 text-6xl mb-4">✨</div>
        <h2 className="text-white text-3xl font-bold mb-2">Your Quote is Ready!</h2>
        <p className="text-green-200 mb-6">Based on your {quote.area}m² {quote.bedrooms}-bed property in {quote.region}</p>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
          <div className="bg-green-800/50 rounded-lg p-4">
            <div className="text-green-300 text-sm">Area</div>
            <div className="text-white text-2xl font-bold">{quote.area} m²</div>
          </div>
          <div className="bg-green-800/50 rounded-lg p-4">
            <div className="text-green-300 text-sm">Bedrooms</div>
            <div className="text-white text-2xl font-bold">{quote.bedrooms}</div>
          </div>
          <div className="bg-green-800/50 rounded-lg p-4">
            <div className="text-green-300 text-sm">Region</div>
            <div className="text-white text-2xl font-bold">{quote.region}</div>
          </div>
          <div className="bg-green-800/50 rounded-lg p-4">
            <div className="text-green-300 text-sm">Est. Price</div>
            <div className="text-white text-2xl font-bold">${quote.estimatedPrice}</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center flex-col sm:flex-row">
          <button
            className="bg-white text-green-900 font-bold px-8 py-3 rounded-lg hover:bg-green-100 transition"
            onClick={() => alert('Redirecting to checkout...')}
          >
            Book Now - ${quote.estimatedPrice}
          </button>
          <button
            onClick={() => setQuote(null)}
            className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition"
          >
            New Quote
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📐</div>
        <h3 className="text-white text-2xl font-bold mb-2">Instant Cleaning Quote</h3>
        <p className="text-blue-200">Enter your property details for {userRegion}</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm text-blue-200 mb-1">Property Area (m²)</label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-blue-800/50 border border-blue-600 text-white text-lg"
            placeholder="e.g., 65"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-blue-200 mb-1">Bedrooms</label>
          <input
            type="number"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-blue-800/50 border border-blue-600 text-white text-lg"
            placeholder="e.g., 2"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-lg transition text-lg"
        >
          Get Instant Quote →
        </button>
      </div>
    </form>
  );
}

interface ARScannerProps {
  onQuoteGenerated?: (quote: any) => void;
}

export default function ARScanner({ onQuoteGenerated }: ARScannerProps) {
  const [userRegion, setUserRegion] = useState('NSW');
  const [arSupported, setArSupported] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Check WebXR support
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      try {
        navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
          setArSupported(supported);
        }).catch(() => setArSupported(false));
      } catch {
        setArSupported(false);
      }
    }

    // Get user location for regional pricing (simplified)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (lat > -34 && lat < -28 && lng > 150 && lng < 154) setUserRegion('NSW');
          else if (lat > -39 && lat < -34 && lng > 140 && lng < 150) setUserRegion('VIC');
          else if (lat > -29 && lat < -10 && lng > 137 && lng < 154) setUserRegion('QLD');
          else if (lat > -35 && lat < -13 && lng > 112 && lng < 130) setUserRegion('WA');
          else if (lat > -38 && lat < -28 && lng > 129 && lng < 141) setUserRegion('SA');
          else if (lat > -44 && lat < -39 && lng > 143 && lng < 149) setUserRegion('TAS');
          else if (lat > -36 && lat < -34 && lng > 148 && lng < 150) setUserRegion('ACT');
          else if (lat > -26 && lat < -10 && lng > 129 && lng < 138) setUserRegion('NT');
        },
        () => {} // Silently fail
      );
    }
  }, []);

  const handleStartScan = () => {
    if (arSupported) {
      setScanning(true);
    }
  };

  if (scanning && arSupported) {
    return (
      <div className="w-full bg-black rounded-2xl overflow-hidden min-h-[500px] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-pulse">📱</div>
          <h3 className="text-2xl font-bold mb-2">AR Mode Active</h3>
          <p className="text-gray-400 mb-6">Point your camera at the room to measure</p>
          <button
            onClick={() => setScanning(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition"
          >
            Cancel Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Region selector */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <label className="block text-sm text-gray-400 mb-2">Select your region:</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.keys(PRICING_DATA).map((region) => (
            <button
              key={region}
              onClick={() => setUserRegion(region)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                userRegion === region
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Pricing: ${PRICING_DATA[userRegion].baseRate}/m² (min ${PRICING_DATA[userRegion].minPrice})
        </p>
      </div>

      {/* AR or Manual */}
      <ManualEntryForm
        onQuoteGenerated={onQuoteGenerated}
        userRegion={userRegion}
      />

      {/* AR button if supported */}
      {arSupported && (
        <button
          onClick={handleStartScan}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          🎯 Launch AR Scanner
        </button>
      )}
    </div>
  );
}
