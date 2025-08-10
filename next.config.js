/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'react.dev',
      },
      {
        protocol: 'https',
        hostname: 'nextjs.org',
      },
      {
        protocol: 'https',
        hostname: 'www.typescriptlang.org',
      },
      {
        protocol: 'https',
        hostname: 'static.figma.com',
      },
      {
        protocol: 'https',
        hostname: 'dribbble.com',
      },
      {
        protocol: 'https',
        hostname: 'developer.mozilla.org',
      },
    ],
  },
}

module.exports = nextConfig