/** @type {import('next').NextConfig} */

const nextConfig = {
  allowedDevOrigins: ["192.168.31.101"],

  async rewrites() {
    const backendOrigin = process.env.BACKEND_API_ORIGIN ?? "http://localhost:5222";

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
      // Backend-served uploads (banner/product/brand images returned as
      // relative /uploads/... paths). Proxied so they resolve in dev
      // (Next :3000 vs API :5222) and same-host production alike.
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },

  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

module.exports = nextConfig;