/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // PWA headers
  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },

  // Suppress build-time warnings from Amplify during static generation
  // Amplify will only be initialized in the browser (client-side)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side webpack config
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /amplify/ },
      ];
    }
    return config;
  },
}

module.exports = nextConfig
