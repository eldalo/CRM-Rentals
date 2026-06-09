import './globals.css';
import type { Metadata } from 'next';
import AppShell from './components/AppShell';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'CRM - Activos GI',
  description: 'CRM - Activos GI',
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  themeColor: '#1e40af',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
