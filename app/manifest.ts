import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Essensplan',
    short_name: 'Essensplan',
    description: 'Familienessensplan',
    start_url: '/',
    display: 'standalone',
    background_color: '#172554',
    theme_color: '#172554',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
