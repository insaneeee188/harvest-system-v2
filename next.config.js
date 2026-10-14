/** @type {import('next').Next.jsConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin'],
  webpack: (config) => {
    return config;
  },
  // Tambahkan baris ini untuk meredakan protes Turbopack di Next.js 16
  turbopack: {},
};

module.exports = nextConfig;