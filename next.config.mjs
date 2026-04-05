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
