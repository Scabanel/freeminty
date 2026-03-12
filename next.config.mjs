/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.seadn.io' },
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: 'cloudflare-ipfs.com' },
      { protocol: 'https', hostname: 'arweave.net' },
      { protocol: 'https', hostname: '**.reservoir.tools' },
      { protocol: 'https', hostname: 'assets.reservoir.tools' },
      { protocol: 'https', hostname: '**.zora.co' },
      { protocol: 'https', hostname: 'zora.co' },
      { protocol: 'https', hostname: '**.mypinata.cloud' },
      { protocol: 'https', hostname: 'media.niftygateway.com' },
      { protocol: 'https', hostname: '**.opensea.io' },
    ],
  },
}

export default nextConfig
