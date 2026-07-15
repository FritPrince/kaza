/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kaza/shared'],
  eslint: {
    // Linting runs as a dedicated turbo task (`pnpm lint`), not inside next build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
