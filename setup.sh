#!/bin/bash

# Create all directories
mkdir -p app/\(auth\) app/api/generate-city app/dashboard components/ui lib public/models

# --- package.json ---
cat > package.json << 'EOF'
{
  "name": "lumina-clean",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@react-three/drei": "^9.120.0",
    "@react-three/fiber": "^8.17.6",
    "@react-three/xr": "^6.1.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.48.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.4.0",
    "gsap": "^3.12.5",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.475.0",
    "next": "15.1.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-leaflet": "^5.0.0",
    "three": "^0.173.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.15",
    "@types/node": "^22.13.4",
    "@types/react": "^19.0.10",
    "@types/three": "^0.173.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.20.1",
    "eslint-config-next": "15.1.7",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3"
  }
}
EOF

# --- next.config.mjs ---
cat > next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'three'];
    return config;
  },
};

export default nextConfig;
EOF

# --- tailwind.config.ts ---
cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
EOF

# --- postcss.config.mjs ---
cat > postcss.config.mjs << 'EOF'
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
export default config;
EOF

# --- tsconfig.json ---
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# --- .gitignore ---
cat > .gitignore << 'EOF'
# dependencies
node_modules
.pnp
.pnp.js
.yarn/install-state.gz

# testing
coverage

# next.js
.next/
out/
build
dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel
EOF

# --- .env.local ---
cat > .env.local << 'EOF'
# Replace with your Supabase project details
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF

# --- app/globals.css ---
cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0a0a0a;
  --foreground: #ededed;
}

body {
  color: var(--foreground);
  background: var(--background);
}
EOF

# --- app/layout.tsx ---
cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LuminaClean | 2026 Enterprise Cleaning • 3D AR Tours',
  description: 'Book enterprise cleaning with immersive 3D/WebXR previews. AI quotes in 8 seconds. ISO-certified.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
EOF

# --- app/page.tsx (public marketing + 3D hero) ---
cat > app/page.tsx << 'EOF'
'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useState } from 'react';

const OfficeScene = dynamic(() => import('@/components/OfficeScene'), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-gray-900 animate-pulse" />
});

export default function HomePage() {
  const [cleanMessage, setCleanMessage] = useState('');

  return (
    <main className="min-h-screen">
      {/* Hero with 3D scene */}
      <section className="relative w-full h-[600px]">
        <OfficeScene onCleanComplete={() => setCleanMessage('✨ Your virtual office is now spotless!')} />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white text-center drop-shadow-2xl">
            Clean offices.<br />Immersive previews.
          </h1>
        </div>
        {cleanMessage && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
            {cleanMessage}
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="flex justify-center gap-4 py-12">
        <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition">
          Client Dashboard
        </Link>
        <button className="bg-white text-black font-semibold py-3 px-8 rounded-lg hover:bg-gray-200 transition">
          Get Quote
        </button>
      </div>
    </main>
  );
}
EOF

# --- app/(auth)/layout.tsx ---
cat > app/\(auth\)/layout.tsx << 'EOF'
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
EOF

# --- app/dashboard/layout.tsx ---
cat > app/dashboard/layout.tsx << 'EOF'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-blue-600">
          LuminaClean Dashboard
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-600">
            <LogOut size={20} /> Sign Out
          </button>
        </form>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
EOF

# --- app/dashboard/page.tsx ---
cat > app/dashboard/page.tsx << 'EOF'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome back, {user?.email}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bookings table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>
          {bookings && bookings.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Preview</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="py-2">{new Date(booking.date).toLocaleDateString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <Link href={`/dashboard/preview/${booking.id}`} className="text-blue-600 hover:underline">
                        View 3D
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No bookings yet.</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/booking/new" className="text-blue-600 hover:underline">➕ New Booking</Link>
            </li>
            <li>
              <Link href="/dashboard/quotes" className="text-blue-600 hover:underline">💰 View Quotes</Link>
            </li>
            <li>
              <Link href="/dashboard/settings" className="text-blue-600 hover:underline">⚙️ Settings</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
EOF

# --- app/api/generate-city/route.ts ---
cat > app/api/generate-city/route.ts << 'EOF'
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
EOF

# --- components/OfficeScene.tsx ---
cat > components/OfficeScene.tsx << 'EOF'
'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, XR, XRButton } from '@react-three/xr';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

interface OfficeSceneProps {
  onCleanComplete?: () => void;
}

export default function OfficeScene({ onCleanComplete }: OfficeSceneProps) {
  const [isClean, setIsClean] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load models with error handling
  let beforeScene: THREE.Group | null = null;
  let afterScene: THREE.Group | null = null;
  try {
    const { scene: before } = useGLTF('/models/office-before.glb');
    const { scene: after } = useGLTF('/models/office-after.glb');
    beforeScene = before;
    afterScene = after;
    useEffect(() => setModelsLoaded(true), []);
  } catch (err) {
    useEffect(() => setError('Failed to load 3D models. Check console.'), []);
    console.error(err);
  }

  const handleClean = () => {
    setIsClean(true);
    onCleanComplete?.();
  };

  if (error) {
    return <div className="w-full h-full flex items-center justify-center text-red-500">{error}</div>;
  }

  if (!modelsLoaded) {
    return <div className="w-full h-full flex items-center justify-center">Loading 3D models...</div>;
  }

  return (
    <>
      <XRButton mode="AR" className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
        Launch AR Tour
      </XRButton>
      <Canvas>
        <XR>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} castShadow />
          <primitive object={isClean ? afterScene : beforeScene} scale={1.8} />
          <OrbitControls enablePan={false} />
          <Environment preset="warehouse" />
        </XR>
      </Canvas>
      <button
        onClick={handleClean}
        className="absolute bottom-4 left-4 bg-white text-black px-4 py-2 rounded shadow-lg hover:bg-gray-200 transition"
      >
        Trigger Full Cleaning Animation
      </button>
    </>
  );
}
EOF

# --- components/XRButton.tsx (simple wrapper) ---
cat > components/XRButton.tsx << 'EOF'
'use client';
import { XRButton as DreiXRButton } from '@react-three/xr';

export default function XRButton({ children, ...props }: any) {
  return <DreiXRButton {...props}>{children}</DreiXRButton>;
}
EOF

# --- components/BookingForm.tsx ---
cat > components/BookingForm.tsx << 'EOF'
'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function BookingForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    squareFeet: 1000,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in first');
      return;
    }

    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      date: formData.date,
      square_feet: formData.squareFeet,
      notes: formData.notes,
      status: 'pending',
    });

    if (error) {
      alert('Error creating booking: ' + error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block mb-1">Date</label>
        <input
          type="date"
          required
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>
      <div>
        <label className="block mb-1">Square Feet</label>
        <input
          type="number"
          min="100"
          required
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          value={formData.squareFeet}
          onChange={(e) => setFormData({ ...formData, squareFeet: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <label className="block mb-1">Notes</label>
        <textarea
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Request Quote'}
      </button>
    </form>
  );
}
EOF

# --- components/CityAEOContent.tsx ---
cat > components/CityAEOContent.tsx << 'EOF'
'use client';
import { useEffect, useState } from 'react';

interface CityContent {
  title: string;
  metaDescription: string;
  faq: { q: string; a: string }[];
  stats: { retention: string; onTime: string; price: string };
}

export default function CityAEOContent({ city }: { city: string }) {
  const [content, setContent] = useState<CityContent | null>(null);

  useEffect(() => {
    fetch(`/api/generate-city?city=${encodeURIComponent(city)}`)
      .then((res) => res.json())
      .then(setContent)
      .catch(console.error);
  }, [city]);

  if (!content) return <div>Loading city info...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">{content.metaDescription}</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{content.stats.retention}</div>
          <div className="text-sm">Client Retention</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{content.stats.onTime}</div>
          <div className="text-sm">On-Time Delivery</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{content.stats.price}</div>
          <div className="text-sm">Avg. Price/sq ft</div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {content.faq.map((item, idx) => (
          <div key={idx} className="border-b pb-4">
            <h3 className="font-medium text-lg">{item.q}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# --- lib/supabase.ts ---
cat > lib/supabase.ts << 'EOF'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Client-side usage
export const createClient = () => createClientComponentClient();

// Server-side usage
export const createServerClient = () => createServerComponentClient({ cookies });
EOF

# --- lib/utils.ts ---
cat > lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF

# --- middleware.ts (for auth protection) ---
cat > middleware.ts << 'EOF'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();
  return res;
}
EOF

# --- public/favicon.ico placeholder ---
touch public/favicon.ico

echo "✅ All files created successfully!"
echo "Next steps:"
echo "1. Place your GLB models in public/models/ (office-before.glb, office-after.glb)"
echo "2. Create a Supabase project and copy your URL and anon key into .env.local"
echo "3. Run the SQL schema (see instructions) in your Supabase SQL editor"
echo "4. Run 'npm install' and then 'npm run dev' to start"
EOF
