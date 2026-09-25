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

  async headers() {
    // Security headers. CSP starts in Report-Only so any third-party
    // script/embed that needs a violation report is visible in devtools
    // before it is enforced. Switch to Content-Security-Policy after
    // reviewing reports in a staging pass.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
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
      // Local backend-served uploads when used through next/image
      // (rewrite /uploads → API). Add production host when known.
      {
        protocol: "http",
        hostname: "localhost",
        port: "5222",
        pathname: "/uploads/**",
      },
    ],
  },
};

module.exports = nextConfig;