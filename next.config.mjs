const security = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
export default {
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverComponentsExternalPackages: ["better-sqlite3"] },
  async headers() { return [{ source: "/:path*", headers: security }]; },
};
