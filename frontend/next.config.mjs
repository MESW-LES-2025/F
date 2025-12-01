/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    // Remove trailing slash if present to avoid double slashes
    const cleanApiUrl = apiUrl.replace(/\/$/, '');
    
    return [
      {
        source: '/api/:path*',
        destination: `${cleanApiUrl}/:path*`,
      },
    ];
  },
}

export default nextConfig
