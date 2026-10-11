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
};

export default nextConfig;