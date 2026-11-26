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
        source: "/offline-sales/invoices/:path*",
        destination: "/dashboard/offline-sales/sales-invoice",
        permanent: false,
      },
      {
        source: "/dashboard/:path+",
        destination: "/:path+",
        permanent: false,
      },
      {
        source: "/about-us",
        destination: "/about",
        permanent: false,
      },
      {
        source: "/contact-us",
        destination: "/contact",
        permanent: false,
      },
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: false,
      },
      {
        source: "/terms-and-conditions",
        destination: "/terms",
        permanent: false,
      },
      {
        source: "/terms-conditions",
        destination: "/terms",
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
        source: "/sales-challan/view/:id",
        destination: "/dashboard/sales/sales-challan/view/:id",
      },
      {
        source: "/sales-challan",
        destination: "/dashboard/sales/sales-challan",
      },
      {
        source: "/sales-invoice/view/:id",
        destination: "/dashboard/sales/sales-invoice/view/:id",
      },
      {
        source: "/sales-invoice",
        destination: "/dashboard/sales/sales-invoice",
      },
      {
        source:
          "/:first((?!(?:dashboard|login|forgot-password|reset-password|signup|verify-email|api|_next|static|favicon\\.ico|offline|printbridge|features|marketplaces|about|about-us|contact|contact-us|privacy|privacy-policy|terms|terms-and-conditions|terms-conditions)(?:[/#?]|$))[^/]+)/:rest*",
        destination: "/dashboard/:first/:rest*",
      },
    ];
  },
};

export default nextConfig;
