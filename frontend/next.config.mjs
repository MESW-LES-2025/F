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
	if (process.env.VERCEL) {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL;
		// Remove trailing slash if present to avoid double slashes
		const cleanApiUrl = apiUrl.replace(/\/$/, '');
		
		return [
		{
			source: '/api/:path*',
			destination: `${cleanApiUrl}/:path*`,
		},
		];
	}
	return [];
  },
}

export default nextConfig
