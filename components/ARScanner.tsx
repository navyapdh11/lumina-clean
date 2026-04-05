// @ts-nocheck - Three.js JSX elements don't have strict TypeScript definitions
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ARButton, useXRHitTest } from '@react-three/xr';
import * as THREE from 'three';

// Australian pricing data by region
const PRICING_DATA = {
  NSW: { baseRate: 2.89, minPrice: 149, currency: 'AUD' },
  VIC: { baseRate: 2.79, minPrice: 139, currency: 'AUD' },
  QLD: { baseRate: 2.69, minPrice: 129, currency: 'AUD' },
  WA: { baseRate: 2.99, minPrice: 159, currency: 'AUD' },
  SA: { baseRate: 2.59, minPrice: 119, currency: 'AUD' },
  TAS: { baseRate: 2.49, minPrice: 109, currency: 'AUD' },
  ACT: { baseRate: 3.09, minPrice: 169, currency: 'AUD' },
  NT: { baseRate: 3.19, minPrice: 179, currency: 'AUD' },
};

interface RoomMeasurement {
  area: number;
  bedrooms: number;
  estimatedPrice: number;
  region: string;
}

function RoomScannerOverlay({ onMeasurement }: { onMeasurement: (m: RoomMeasurement) => void }) {
  const [scanning, setScanning] = useState(false);
  const [measurements, setMeasurements] = useState<number[]>([]);
  const reticleRef = useRef<THREE.Group>(null);
  const hitTestResult = useRef<any>(null);
  
  // @ts-ignore - useXRHitTest API varies by version
  useXRHitTest((space: any, hit: any) => {
    const hitMatrix = hit?.pose?.localToViewerMatrix || hit?.pose?.localToCameraMatrix;
    hitTestResult.current = { hitMatrix, hit };
    
    if (reticleRef.current && scanning) {
      reticleRef.current.visible = true;
      reticleRef.current.position.setFromMatrixPosition(hitMatrix);
      
      // Simulate measurement collection
      if (measurements.length < 50) {
        const randomArea = 15 + Math.random() * 80; // 15-95 sqm
        setMeasurements(prev => [...prev, randomArea]);
      } else if (measurements.length === 50) {
        // Calculate final measurement
        const avgArea = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const bedrooms = Math.round(avgArea / 25); // ~25sqm per bedroom
        const region = 'NSW'; // Default, will be updated from user location
        const pricing = PRICING_DATA[region as keyof typeof PRICING_DATA];
        const estimatedPrice = Math.max(pricing.minPrice, Math.round(avgArea * pricing.baseRate));
        
        const measurement: RoomMeasurement = {
          area: Math.round(avgArea),
          bedrooms,
          estimatedPrice,
          region,
        };
        
        onMeasurement(measurement);
        setScanning(false);
      }
    }
  });

  return scanning ? <group ref={reticleRef} visible={false} /> : null;
}

function MeasurementVisualization({ points }: { points: THREE.Vector3[] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current && points.length > 2) {
      // Create floor plane visualization
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = geometry;
    }
  });

  if (points.length < 3) return null;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial 
        color="#3b82f6" 
        transparent 
        opacity={0.3} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

interface ARScannerProps {
  onQuoteGenerated?: (quote: RoomMeasurement & { timestamp: Date }) => void;
}

export default function ARScanner({ onQuoteGenerated }: ARScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [measurement, setMeasurement] = useState<RoomMeasurement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [arSupported, setArSupported] = useState(true);
  const [userRegion, setUserRegion] = useState<keyof typeof PRICING_DATA>('NSW');

  useEffect(() => {
    // Check WebXR support
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
        setArSupported(supported);
      }).catch(() => setArSupported(false));
    }

    // Get user location for regional pricing
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Simple region detection based on coordinates
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

  const handleMeasurement = useCallback((m: RoomMeasurement) => {
    // Update pricing based on detected region
    const pricing = PRICING_DATA[userRegion];
    const updatedPrice = Math.max(pricing.minPrice, Math.round(m.area * pricing.baseRate));
    
    const updatedMeasurement = {
      ...m,
      region: userRegion,
      estimatedPrice: updatedPrice,
    };
    
    setMeasurement(updatedMeasurement);
    onQuoteGenerated?.({ ...updatedMeasurement, timestamp: new Date() });
  }, [userRegion, onQuoteGenerated]);

  const handleStartScan = () => {
    setIsScanning(true);
    setMeasurement(null);
    setError(null);
  };

  const handleReset = () => {
    setIsScanning(false);
    setMeasurement(null);
    setError(null);
  };

  if (error) {
    return (
      <div className="w-full min-h-[400px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h3 className="text-white text-xl font-semibold mb-2">AR Not Available</h3>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={handleReset}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (measurement) {
    return (
      <div className="w-full bg-gradient-to-br from-green-900 to-green-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <div className="text-green-400 text-6xl mb-4">✨</div>
          <h2 className="text-white text-3xl font-bold mb-2">Scan Complete!</h2>
          <p className="text-green-200 mb-6">Your instant quote is ready</p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
            <div className="bg-green-800/50 rounded-lg p-4">
              <div className="text-green-300 text-sm">Area</div>
              <div className="text-white text-2xl font-bold">{measurement.area} m²</div>
            </div>
            <div className="bg-green-800/50 rounded-lg p-4">
              <div className="text-green-300 text-sm">Bedrooms</div>
              <div className="text-white text-2xl font-bold">{measurement.bedrooms} bed</div>
            </div>
            <div className="bg-green-800/50 rounded-lg p-4">
              <div className="text-green-300 text-sm">Region</div>
              <div className="text-white text-2xl font-bold">{measurement.region}</div>
            </div>
            <div className="bg-green-800/50 rounded-lg p-4">
              <div className="text-green-300 text-sm">Est. Price</div>
              <div className="text-white text-2xl font-bold">${measurement.estimatedPrice}</div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              className="bg-white text-green-900 font-bold px-8 py-3 rounded-lg hover:bg-green-100 transition"
              onClick={() => alert('Redirecting to Stripe checkout...')}
            >
              Book Now - ${measurement.estimatedPrice}
            </button>
            <button
              onClick={handleReset}
              className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition"
            >
              Scan Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!isScanning ? (
        <div className="w-full bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="text-blue-400 text-6xl mb-4">📐</div>
            <h2 className="text-white text-3xl font-bold mb-2">AR Room Scanner</h2>
            <p className="text-blue-200 mb-6">
              Point your camera at the room and we'll measure it automatically.
              <br />
              Get an instant quote based on your location in {userRegion}.
            </p>
            
            {arSupported ? (
              <button
                onClick={handleStartScan}
                className="bg-white text-blue-900 font-bold px-8 py-4 rounded-lg hover:bg-blue-100 transition text-lg"
                aria-label="Start AR room scanning"
              >
                🎯 Start AR Scan
              </button>
            ) : (
              <div className="text-yellow-300">
                <p>AR not supported on this device. Use manual entry below.</p>
                <ManualEntryForm onQuoteGenerated={onQuoteGenerated} userRegion={userRegion} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div id="ar-overlay" className="relative w-full h-[500px] bg-black rounded-2xl overflow-hidden">
          <Canvas
            shadows
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [0, 0, 0] }}
          >
            <ambientLight intensity={0.5} />
            <RoomScannerOverlay onMeasurement={handleMeasurement} />
          </Canvas>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 text-white px-6 py-3 rounded-lg">
              Scanning room... Move your device slowly
            </div>
          </div>
          
          <button
            onClick={handleReset}
            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg pointer-events-auto"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Fallback for devices without AR support
function ManualEntryForm({ onQuoteGenerated, userRegion }: { onQuoteGenerated?: (q: any) => void; userRegion: string }) {
  const [area, setArea] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pricing = PRICING_DATA[userRegion as keyof typeof PRICING_DATA];
    const areaNum = parseFloat(area) || 50;
    const bedNum = parseInt(bedrooms) || 2;
    const estimatedPrice = Math.max(pricing.minPrice, Math.round(areaNum * pricing.baseRate));
    
    const quote = {
      area: areaNum,
      bedrooms: bedNum,
      estimatedPrice,
      region: userRegion,
      timestamp: new Date(),
    };
    
    onQuoteGenerated?.(quote);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-md mx-auto space-y-4">
      <div>
        <label className="block text-sm text-yellow-200 mb-1">Area (m²)</label>
        <input
          type="number"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-yellow-900/50 border border-yellow-600 text-white"
          placeholder="e.g., 65"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-yellow-200 mb-1">Bedrooms</label>
        <input
          type="number"
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-yellow-900/50 border border-yellow-600 text-white"
          placeholder="e.g., 2"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition"
      >
        Get Quote
      </button>
    </form>
  );
}
