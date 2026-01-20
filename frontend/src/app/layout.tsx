import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AIProvider from '@/components/AIProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Lulu Hypermarket Sales Dashboard | Real-time Analytics',
  description: 'Real-time sales streaming and analytics dashboard for Lulu Hypermarket UAE',
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-900 text-white antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <AIProvider>
            {children}
          </AIProvider>
        </div>
      </body>
    </html>
  );
}
