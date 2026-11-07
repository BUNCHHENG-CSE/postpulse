/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', 'prisma', 'pg'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
