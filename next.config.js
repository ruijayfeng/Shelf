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
      // Allow favicon loading from any domain
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/favicon.ico',
      },
      // Common favicon paths
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/static/**',
      },
      // CDN domains for favicons
      {
        protocol: 'https',
        hostname: 'cdn.sstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'github.githubassets.com',
      },
      {
        protocol: 'https',
        hostname: 'www.youtube.com',
      },
    ],
  },
}

module.exports = nextConfig