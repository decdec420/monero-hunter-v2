import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Monero Hunter · Profit Control', description: 'Live mining economics, measured performance, and honest cash accounting.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="en"><body>{children}</body></html>;}
