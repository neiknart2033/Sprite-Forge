import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Sprite-Forge | Online Sprite Slicer & Optimal Texture Atlas Packer',
  description:
    'Free online 2-in-1 sprite sheet slicer and optimal texture atlas packer. MaxRects 2D bin packing, Power-of-Two sizing, 1px extrude texture bleeding guards, Godot 4, and Phaser 3 export. 100% Client-Side Privacy.',
  keywords: [
    'sprite sheet cutter',
    'sprite sheet packer online',
    'free texture packer alternative',
    'split sprite sheet into frames',
    'texture atlas generator online',
    'godot sprite sheet slicer',
    'trim transparent pixels sprite sheet',
    'power of two texture atlas packer online',
  ],
  authors: [{ name: 'Sprite-Forge Team' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark bg-zinc-950 text-zinc-100 antialiased`}
    >
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
