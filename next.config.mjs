/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    GEMINI_API_KEY: 'AIzaSyDJ814rcw5z5kdjLvDWcMb_ajvYaxHLT0g',
  },
};

export default nextConfig;
