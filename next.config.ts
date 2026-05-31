import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          // Firebase popup auth requires the opener to have COOP: unsafe-none
          // so the parent page can observe window.closed on the popup.
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://apis.google.com https://maps.googleapis.com https://amarago-1173a.firebaseapp.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://amarago-1173a.firebaseapp.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://firebasestorage.googleapis.com https://maps.gstatic.com https://*.googleusercontent.com",
              "connect-src 'self' http://localhost:8000 https://amarago-backend-d4iefytflq-el.a.run.app https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com https://amarago-1173a.firebaseapp.com https://api.razorpay.com wss://*.firebaseio.com https://api.bigdatacloud.net",
              "frame-src https://checkout.razorpay.com https://accounts.google.com https://amarago-1173a.firebaseapp.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;