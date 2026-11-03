import type { NextConfig } from "next";
import os from "os";

const nets = os.networkInterfaces();
const allowedIPs = [];
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === "IPv4" && !net.internal) {
      allowedIPs.push(net.address);
    }
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedIPs,
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/dashboard/:path+",
        destination: "/:path+",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const backendBase = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendBase}/uploads/:path*`,
      },
      {
        source:
          "/:first((?!dashboard|login|forgot-password|reset-password|signup|verify-email|api|_next|static|favicon\\.ico|offline|printbridge)[^/]+)/:rest*",
        destination: "/dashboard/:first/:rest*",
      },
    ];
  },
};

export default nextConfig;
