/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@prisma/client"],
  },
  async headers() {
    const classroomMediaPolicy = [
      {
        key: "Permissions-Policy",
        value: "camera=*, microphone=*, display-capture=*, speaker-selection=*",
      },
    ];

    return [
      {
        source: "/classes/:path*",
        headers: classroomMediaPolicy,
      },
      {
        source: "/live/:path*",
        headers: classroomMediaPolicy,
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ],
      },
    ];
  },
};

export default nextConfig;
