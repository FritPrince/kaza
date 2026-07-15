import type { Metadata } from 'next';
import { Archivo, Fraunces, Spline_Sans_Mono } from 'next/font/google';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] });
const sans = Archivo({ subsets: ['latin'], variable: '--font-sans' });
const mono = Spline_Sans_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Kaza — Back-office',
  description: 'Administration de Kaza, assistant visuel intelligent de l’habitat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
