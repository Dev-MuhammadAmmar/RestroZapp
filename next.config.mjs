// next.config.mjs
import withPWA from 'next-pwa';

const isDev = process.env.NODE_ENV === 'development';

// Base Next.js configuration
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Explicitly set turbopack config to empty object to satisfy Next.js 16
  turbopack: {},
};

// Wrap with PWA configuration
const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: isDev,
  // Removed runtimeCaching for now - add back when needed
})(nextConfig);

export default config;