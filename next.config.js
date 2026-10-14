/** @type {import('next').Next.jsConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin'],
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;