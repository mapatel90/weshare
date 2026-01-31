/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "localhost",
      "127.0.0.1",
      "api.weshare-energy.com",
      "weshare-energy.com",
      "weshare-uploads.s3.ap-southeast-1.amazonaws.com",
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
      // AWS S3 uploads
      {
        protocol: "https",
        hostname: "weshare-uploads.s3.ap-southeast-1.amazonaws.com",
        pathname: "/project-images/**",
      },
    ],
  },
};

export default nextConfig;
