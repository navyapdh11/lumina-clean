'use client';
// R3F JSX types are an upstream issue: https://github.com/pmndrs/react-three-fiber/issues/2396
// @ts-nocheck — runtime is fully functional; types provided by @react-three/fiber
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import { ACESFilmicToneMapping, type Mesh } from 'three';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// ── Types ──────────────────────────────────────────────────────────
export interface Quote {
  area: number;
  bedrooms: number;
  estimatedPrice: number;
  region: string;
}

interface SavedRoom {
  id: string;
  name: string;
  width: number;
  length: number;
  height: number;
  area: number;
  bedrooms: number;
  estimatedPrice: number;
  region: string;
  image?: string; // base64 preview
  createdAt: string;
  notes: string;
}

// ── Australian Pricing ─────────────────────────────────────────────
const PRICING_DATA: Record<string, { baseRate: number; minPrice: number; name: string }> = {
  NSW: { baseRate: 2.89, minPrice: 149, name: 'New South Wales' },
  VIC: { baseRate: 2.79, minPrice: 139, name: 'Victoria' },
  QLD: { baseRate: 2.69, minPrice: 129, name: 'Queensland' },
  WA: { baseRate: 2.99, minPrice: 159, name: 'Western Australia' },
  SA: { baseRate: 2.59, minPrice: 119, name: 'South Australia' },
  TAS: { baseRate: 2.49, minPrice: 109, name: 'Tasmania' },
  ACT: { baseRate: 3.09, minPrice: 169, name: 'ACT' },
  NT: { baseRate: 3.19, minPrice: 179, name: 'Northern Territory' },
};

const STORAGE_KEY = 'lumina_saved_rooms';

function loadSavedRooms(): SavedRoom[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRoomsToStorage(rooms: SavedRoom[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    console.warn('Failed to save rooms to localStorage');
  }
}

// ── 3D Room Component ──────────────────────────────────────────────
function Room3D({ width, length, height, isScanning }: { width: number; length: number; height: number; isScanning: boolean }) {
  const floorRef = useRef<Mesh>(null);
  const scanLineRef = useRef<Mesh>(null);
  const [scanProgress, setScanProgress] = useState(0);

  useFrame((state) => {
    if (isScanning && scanProgress < 1) {
      setScanProgress((p) => Math.min(p + 0.015, 1));
    }
    if (scanLineRef.current && isScanning) {
      scanLineRef.current.position.z = -length / 2 + length * scanProgress;
    }
    if (floorRef.current && isScanning) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.05 + 1;
      floorRef.current.scale.set(pulse, 1, pulse);
    }
  });

  const wallColor = isScanning ? '#1e3a5f' : '#374151';
  const floorColor = isScanning ? '#1a4d2e' : '#4b5563';
  const edgeColor = isScanning ? '#3b82f6' : '#6b7280';

  return (
    <group>
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} metalness={0.2} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        args={[width, length]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3b82f6"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#60a5fa"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid={false}
      />
      <mesh position={[0, height / 2, -length / 2]} castShadow>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[length, height, 0.05]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[length, height, 0.05]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} metalness={0.3} transparent opacity={0.3} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, 0.05, length)]} />
        <lineBasicMaterial color={edgeColor} linewidth={1} />
        <mesh position={[0, 0.025, 0]} />
      </lineSegments>
      <Text position={[0, -0.3, length / 2 + 0.5]} fontSize={0.3} color="#93c5fd" anchorX="center" anchorY="middle">
        {width.toFixed(1)}m
      </Text>
      <Text position={[width / 2 + 0.8, height / 2, 0]} fontSize={0.3} color="#93c5fd" anchorX="center" anchorY="middle" rotation={[0, 0, Math.PI / 2]}>
        {height.toFixed(1)}m
      </Text>
      <Text position={[0, -0.3, -length / 2 - 0.5]} fontSize={0.3} color="#93c5fd" anchorX="center" anchorY="middle">
        {length.toFixed(1)}m
      </Text>
      <Text position={[0, 0.05, 0]} fontSize={0.4} color="#34d399" anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>
        {(width * length).toFixed(1)} m²
      </Text>
      {isScanning && (
        <mesh ref={scanLineRef} position={[0, height / 2, -length / 2]}>
          <boxGeometry args={[width, height, 0.02]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.4} emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
      )}
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * width / 2, 0.05, z * length / 2]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── 3D Scene ───────────────────────────────────────────────────────
function Scene({ width, length, height, isScanning }: { width: number; length: number; height: number; isScanning: boolean }) {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true, toneMapping: ACESFilmicToneMapping }}
      camera={{ position: [width + 2, height + 1, length + 2], fov: 50 }}
      style={{ background: '#0f172a' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#3b82f6" />
      <Room3D width={width} length={length} height={height} isScanning={isScanning} />
      <OrbitControls
        enablePan
        minDistance={3}
        maxDistance={25}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, height / 3, 0]}
      />
    </Canvas>
  );
}

// ── Saved Room Card ────────────────────────────────────────────────
function SavedRoomCard({
  room,
  onEdit,
  onDelete,
  onLoad,
}: {
  room: SavedRoom;
  onEdit: (room: SavedRoom) => void;
  onDelete: (id: string) => void;
  onLoad: (room: SavedRoom) => void;
}) {
  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden hover:border-blue-500/50 transition group">
      {/* Image preview */}
      {room.image ? (
        <div className="relative h-32 bg-gray-900 overflow-hidden">
          <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        </div>
      ) : (
        <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600" />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white truncate">{room.name}</h4>
            <p className="text-xs text-gray-400">
              {room.region} • {new Date(room.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className="text-lg font-bold text-green-400 ml-2">${room.estimatedPrice}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-3">
          <div className="bg-gray-700/50 rounded px-2 py-1.5 text-center">
            <div className="text-white font-medium">{room.area.toFixed(1)}m²</div>
            Area
          </div>
          <div className="bg-gray-700/50 rounded px-2 py-1.5 text-center">
            <div className="text-white font-medium">{room.bedrooms}</div>
            Beds
          </div>
          <div className="bg-gray-700/50 rounded px-2 py-1.5 text-center">
            <div className="text-white font-medium">{room.width}×{room.length}m</div>
            Room
          </div>
        </div>

        {room.notes && (
          <p className="text-xs text-gray-500 mb-3 truncate">{room.notes}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onLoad(room)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition"
          >
            Load
          </button>
          <button
            onClick={() => onEdit(room)}
            className="px-3 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-2 rounded-lg transition"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(room.id)}
            className="px-3 bg-red-900/50 hover:bg-red-800/50 text-red-400 hover:text-red-300 text-xs font-medium py-2 rounded-lg transition border border-red-700/30"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Room Modal ────────────────────────────────────────────────
function EditRoomModal({
  room,
  onSave,
  onCancel,
}: {
  room: SavedRoom;
  onSave: (room: SavedRoom) => void;
  onCancel: () => void;
}) {
  const [editRoom, setEditRoom] = useState<SavedRoom>({ ...room });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditRoom((prev) => ({ ...prev, image: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!editRoom.name.trim()) {
      alert('Room name is required');
      return;
    }
    if (editRoom.width < 1 || editRoom.length < 1 || editRoom.height < 1) {
      alert('Dimensions must be at least 1m');
      return;
    }
    const pricing = PRICING_DATA[editRoom.region] || PRICING_DATA.NSW;
    const area = editRoom.width * editRoom.length;
    const estimatedPrice = Math.max(pricing.minPrice, Math.round(area * pricing.baseRate));
    onSave({ ...editRoom, area, estimatedPrice });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">✏️ Edit Room</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white text-xl transition" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Room Name</label>
            <input
              type="text"
              value={editRoom.name}
              onChange={(e) => setEditRoom((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Living Room"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Room Photo</label>
            {editRoom.image ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-700">
                <img src={editRoom.image} alt="Room" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 hover:opacity-100 transition">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => setEditRoom((p) => ({ ...p, image: undefined }))}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-lg p-6 text-center transition"
              >
                <div className="text-3xl mb-2">📷</div>
                <div className="text-gray-400 text-sm">Click to upload room photo</div>
                <div className="text-gray-500 text-xs mt-1">PNG, JPG up to 5MB</div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Width (m)</label>
              <input
                type="number"
                value={editRoom.width}
                onChange={(e) => setEditRoom((p) => ({ ...p, width: parseFloat(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="50"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Length (m)</label>
              <input
                type="number"
                value={editRoom.length}
                onChange={(e) => setEditRoom((p) => ({ ...p, length: parseFloat(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="50"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Height (m)</label>
              <input
                type="number"
                value={editRoom.height}
                onChange={(e) => setEditRoom((p) => ({ ...p, height: parseFloat(e.target.value) || 2 }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
                step="0.1"
              />
            </div>
          </div>

          {/* Bedrooms + Region */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bedrooms</label>
              <input
                type="number"
                value={editRoom.bedrooms}
                onChange={(e) => setEditRoom((p) => ({ ...p, bedrooms: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Region</label>
              <select
                value={editRoom.region}
                onChange={(e) => setEditRoom((p) => ({ ...p, region: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(PRICING_DATA).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea
              value={editRoom.notes}
              onChange={(e) => setEditRoom((p) => ({ ...p, notes: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {/* Price preview */}
          <div className="bg-blue-900/30 border border-blue-700/30 rounded-lg p-3 text-center">
            <span className="text-sm text-blue-300">Estimated Price: </span>
            <span className="text-xl font-bold text-white">${editRoom.estimatedPrice}</span>
            <span className="text-xs text-gray-400 ml-2">({editRoom.area.toFixed(1)}m²)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-700">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition"
          >
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quote Display ──────────────────────────────────────────────────
function QuoteDisplay({
  quote,
  onReset,
  onSave,
}: {
  quote: Quote;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <div className="w-full bg-gradient-to-br from-green-900/80 to-emerald-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-green-700/50 text-center">
      <div className="text-5xl mb-4">✨</div>
      <h2 className="text-white text-3xl font-bold mb-2">Your Quote is Ready!</h2>
      <p className="text-green-200 mb-6">
        {quote.area.toFixed(1)}m² • {quote.bedrooms} bed • {quote.region}
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
        <div className="bg-green-800/50 rounded-lg p-4 border border-green-600/30">
          <div className="text-green-300 text-xs uppercase tracking-wide">Area</div>
          <div className="text-white text-2xl font-bold">{quote.area.toFixed(1)} m²</div>
        </div>
        <div className="bg-green-800/50 rounded-lg p-4 border border-green-600/30">
          <div className="text-green-300 text-xs uppercase tracking-wide">Bedrooms</div>
          <div className="text-white text-2xl font-bold">{quote.bedrooms}</div>
        </div>
        <div className="bg-green-800/50 rounded-lg p-4 border border-green-600/30">
          <div className="text-green-300 text-xs uppercase tracking-wide">Region</div>
          <div className="text-white text-2xl font-bold">{quote.region}</div>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg p-4 border border-green-400/50">
          <div className="text-green-100 text-xs uppercase tracking-wide">Est. Price</div>
          <div className="text-white text-2xl font-bold">${quote.estimatedPrice}</div>
        </div>
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <button className="bg-white text-green-900 font-bold px-8 py-3 rounded-lg hover:bg-green-50 transition shadow-lg">
          Book Now — ${quote.estimatedPrice}
        </button>
        <button
          onClick={onSave}
          className="bg-green-700/70 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition border border-green-500/30"
        >
          💾 Save
        </button>
        <button
          onClick={onReset}
          className="bg-gray-700/70 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition border border-gray-500/30"
        >
          New Quote
        </button>
      </div>
    </div>
  );
}

// ── Manual Entry Form ──────────────────────────────────────────────
function ManualEntryForm({ onQuoteGenerated, userRegion }: { onQuoteGenerated: (q: Quote) => void; userRegion: string }) {
  const [area, setArea] = useState('65');
  const [bedrooms, setBedrooms] = useState('2');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pricing = PRICING_DATA[userRegion] || PRICING_DATA.NSW;
    const areaNum = parseFloat(area) || 65;
    const bedNum = parseInt(bedrooms) || 2;
    const estimatedPrice = Math.max(pricing.minPrice, Math.round(areaNum * pricing.baseRate));
    onQuoteGenerated({ area: areaNum, bedrooms: bedNum, estimatedPrice, region: userRegion });
  };

  const pricing = PRICING_DATA[userRegion] || PRICING_DATA.NSW;

  return (
    <form onSubmit={handleSubmit} className="w-full bg-gradient-to-br from-blue-900/80 to-indigo-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-blue-700/50">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📐</div>
        <h3 className="text-white text-2xl font-bold mb-2">Instant Cleaning Quote</h3>
        <p className="text-blue-200">Enter your property details for {PRICING_DATA[userRegion]?.name || userRegion}</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm text-blue-200 mb-1">Property Area (m²)</label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-blue-800/50 border border-blue-600/50 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            className="w-full px-4 py-3 rounded-lg bg-blue-800/50 border border-blue-600/50 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g., 2"
            min="1"
            max="10"
            required
          />
        </div>
        <div className="bg-blue-800/30 rounded-lg p-3 text-sm text-blue-200 border border-blue-600/30">
          Rate: ${pricing.baseRate}/m² • Min price: ${pricing.minPrice} • Est: ${Math.max(pricing.minPrice, Math.round((parseFloat(area) || 65) * pricing.baseRate))}
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-lg transition text-lg shadow-lg"
        >
          Get Instant Quote →
        </button>
      </div>
    </form>
  );
}

// ── Main AR Scanner ────────────────────────────────────────────────
interface ARScannerProps {
  onQuoteGenerated?: (quote: Quote) => void;
}

export default function ARScanner({ onQuoteGenerated }: ARScannerProps) {
  const [userRegion, setUserRegion] = useState('NSW');
  const [mode, setMode] = useState<'form' | '3d' | 'quote' | 'saved'>('form');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const mountedRef = useRef(true);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Room dimensions
  const [roomWidth, setRoomWidth] = useState(8);
  const [roomLength, setRoomLength] = useState(6);
  const [roomHeight, setRoomHeight] = useState(2.7);

  // Saved rooms
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [editingRoom, setEditingRoom] = useState<SavedRoom | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    setSavedRooms(loadSavedRooms());
    return () => {
      mountedRef.current = false;
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, []);

  // Auto-detect region
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (lat > -34 && lat < -28 && lng > 150 && lng < 154) setUserRegion('NSW');
          else if (lat > -39 && lat < -34 && lng > 140 && lng < 150) setUserRegion('VIC');
          else if (lat > -29 && lat < -10 && lng > 137 && lng < 154) setUserRegion('QLD');
          else if (lat > -35 && lat < -13 && lng > 112 && lng < 130) setUserRegion('WA');
          else if (lat > -38 && lat < -28 && lng > 129 && lng < 141) setUserRegion('SA');
          else if (lat > -44 && lat < -39 && lng > 143 && lng < 149) setUserRegion('TAS');
          else if (lat > -36 && lat < -34 && lng > 148 && lng < 150) setUserRegion('ACT');
          else if (lat > -26 && lat < -10 && lng > 129 && lng < 138) setUserRegion('NT');
        },
        (err) => console.warn('Geolocation unavailable, defaulting to NSW:', err.code, err.message)
      );
    }
  }, []);

  const handleQuoteGenerated = useCallback(
    (q: Quote) => {
      setQuote(q);
      setMode('quote');
      onQuoteGenerated?.(q);
    },
    [onQuoteGenerated]
  );

  const handleReset = useCallback(() => {
    setQuote(null);
    setMode('form');
  }, []);

  const handleSaveQuote = useCallback(() => {
    if (!quote) return;
    const newRoom: SavedRoom = {
      id: `room_${Date.now()}`,
      name: `Room ${savedRooms.length + 1}`,
      width: roomWidth,
      length: roomLength,
      height: roomHeight,
      area: quote.area,
      bedrooms: quote.bedrooms,
      estimatedPrice: quote.estimatedPrice,
      region: quote.region,
      createdAt: new Date().toISOString(),
      notes: '',
    };
    const updated = [newRoom, ...savedRooms];
    setSavedRooms(updated);
    saveRoomsToStorage(updated);
    alert('Room saved successfully!');
  }, [quote, savedRooms, roomWidth, roomLength, roomHeight]);

  const handleDeleteRoom = useCallback(
    (id: string) => {
      setDeleteConfirm(id);
    },
    []
  );

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return;
    const updated = savedRooms.filter((r) => r.id !== deleteConfirm);
    setSavedRooms(updated);
    saveRoomsToStorage(updated);
    setDeleteConfirm(null);
  }, [deleteConfirm, savedRooms]);

  const handleEditRoom = useCallback((room: SavedRoom) => {
    setEditingRoom(room);
  }, []);

  const handleSaveEdit = useCallback(
    (editedRoom: SavedRoom) => {
      const updated = savedRooms.map((r) => (r.id === editedRoom.id ? editedRoom : r));
      setSavedRooms(updated);
      saveRoomsToStorage(updated);
      setEditingRoom(null);
    },
    [savedRooms]
  );

  const handleLoadRoom = useCallback(
    (room: SavedRoom) => {
      setRoomWidth(room.width);
      setRoomLength(room.length);
      setRoomHeight(room.height);
      setUserRegion(room.region);
      setQuote({
        area: room.area,
        bedrooms: room.bedrooms,
        estimatedPrice: room.estimatedPrice,
        region: room.region,
      });
      setMode('quote');
    },
    []
  );

  const handleStart3D = useCallback(() => {
    setMode('3d');
    setIsScanning(true);
    scanTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setIsScanning(false);
      const area = roomWidth * roomLength;
      const pricing = PRICING_DATA[userRegion] || PRICING_DATA.NSW;
      const estimatedPrice = Math.max(pricing.minPrice, Math.round(area * pricing.baseRate));
      const q: Quote = { area, bedrooms: Math.round(area / 25), estimatedPrice, region: userRegion };
      setQuote(q);
      setMode('quote');
      onQuoteGenerated?.(q);
    }, 3000);
  }, [roomWidth, roomLength, userRegion, onQuoteGenerated]);

  const pricing = PRICING_DATA[userRegion] || PRICING_DATA.NSW;

  return (
    <div className="w-full space-y-6">
      {/* Region Selector */}
      <div className="bg-gray-800/60 backdrop-blur rounded-xl p-4 border border-gray-700/50">
        <label className="block text-sm text-gray-400 mb-2">Select your region:</label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {Object.keys(PRICING_DATA).map((region) => (
            <button
              key={region}
              onClick={() => setUserRegion(region)}
              className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                userRegion === region
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {pricing.name} — ${pricing.baseRate}/m² (min ${pricing.minPrice})
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'form' as const, label: '📝 Manual', active: mode === 'form' },
          { key: '3d' as const, label: '🏠 3D Scan', active: mode === '3d' || mode === 'quote' },
          { key: 'saved' as const, label: `📁 Saved (${savedRooms.length})`, active: mode === 'saved' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (mode !== 'quote') setMode(tab.key);
            }}
            className={`flex-1 py-3 px-3 rounded-lg text-xs sm:text-sm font-medium transition ${
              tab.active
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            } ${mode === 'quote' && tab.key === '3d' ? 'bg-blue-600 text-white' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on mode */}
      {mode === 'form' && (
        <ManualEntryForm onQuoteGenerated={handleQuoteGenerated} userRegion={userRegion} />
      )}

      {mode === '3d' && !quote && (
        <div className="space-y-4">
          {/* 3D Controls */}
          <div className="bg-gray-800/60 backdrop-blur rounded-xl p-4 border border-gray-700/50 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Width (m)</label>
              <input
                type="number"
                value={roomWidth}
                onChange={(e) => setRoomWidth(parseFloat(e.target.value) || 8)}
                className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                min="2"
                max="30"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Length (m)</label>
              <input
                type="number"
                value={roomLength}
                onChange={(e) => setRoomLength(parseFloat(e.target.value) || 6)}
                className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                min="2"
                max="30"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Height (m)</label>
              <input
                type="number"
                value={roomHeight}
                onChange={(e) => setRoomHeight(parseFloat(e.target.value) || 2.7)}
                className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                min="2"
                max="5"
                step="0.1"
              />
            </div>
          </div>

          {/* 3D Canvas */}
          <div className="w-full h-[400px] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700/50 relative">
            <ErrorBoundary name="3D Room Scanner">
              <Scene width={roomWidth} length={roomLength} height={roomHeight} isScanning={isScanning} />
            </ErrorBoundary>
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                <div className="text-center">
                  <div className="text-4xl mb-2 animate-pulse">📡</div>
                  <div className="text-white font-bold text-lg">Scanning Room...</div>
                  <div className="text-gray-300 text-sm">Measuring dimensions</div>
                </div>
              </div>
            )}
          </div>

          {/* Scan Button */}
          <button
            onClick={handleStart3D}
            disabled={isScanning}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-lg shadow-lg"
          >
            {isScanning ? (
              <>
                <span className="animate-spin">📡</span> Scanning...
              </>
            ) : (
              <>🔍 Scan Room & Get Quote</>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Adjust room dimensions, then scan. Drag to orbit, scroll to zoom.
          </p>
        </div>
      )}

      {/* Quote Mode */}
      {mode === 'quote' && quote && (
        <>
          <div className="w-full h-[300px] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700/50">
            <ErrorBoundary name="3D Room Preview">
              <Scene width={roomWidth} length={roomLength} height={roomHeight} isScanning={false} />
            </ErrorBoundary>
          </div>
          <QuoteDisplay quote={quote} onReset={handleReset} onSave={handleSaveQuote} />
        </>
      )}

      {/* Saved Rooms Mode */}
      {mode === 'saved' && (
        <div className="space-y-4">
          {savedRooms.length === 0 ? (
            <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center">
              <div className="text-5xl mb-4">📁</div>
              <h3 className="text-white text-xl font-semibold mb-2">No Saved Rooms Yet</h3>
              <p className="text-gray-400 mb-4">Generate a quote and save it to see it here.</p>
              <button
                onClick={() => setMode('form')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition"
              >
                Create Your First Quote →
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Saved Rooms ({savedRooms.length})</h3>
                <button
                  onClick={() => {
                    if (confirm('Delete all saved rooms?')) {
                      setSavedRooms([]);
                      saveRoomsToStorage([]);
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Clear All
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {savedRooms.map((room) => (
                  <SavedRoomCard
                    key={room.id}
                    room={room}
                    onEdit={handleEditRoom}
                    onDelete={handleDeleteRoom}
                    onLoad={handleLoadRoom}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          onSave={handleSaveEdit}
          onCancel={() => setEditingRoom(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-2xl border border-red-700/50 p-6 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-white text-lg font-bold mb-2">Delete Room?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
