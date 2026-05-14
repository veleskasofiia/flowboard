/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/connected", destination: "/workflow", permanent: true },
    ];
  },
}

module.exports = nextConfig
