/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "localhost",
      "127.0.0.1",
      "api.weshare-energy.com",
      "weshare-energy.com",
    ],
    remotePatterns: [
      // LOCAL backend
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/images/**",
      },

      // LIVE backend
      {
        protocol: "https",
        hostname: "api.weshare-energy.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api.weshare-energy.com",
        pathname: "/images/**",
      },

      // LIVE frontend (if it stores local public images)
      {
        protocol: "https",
        hostname: "weshare-energy.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "weshare-energy.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
