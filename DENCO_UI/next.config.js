/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  // Docker用のスタンドアロンビルド設定
  output: 'standalone',
  // Next.js 16 uses Turbopack by default
  turbopack: {},
};

module.exports = nextConfig;
