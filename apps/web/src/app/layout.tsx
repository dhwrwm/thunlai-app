import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'Thunlai — Bodo Dictionary', template: '%s | Thunlai' },
  description:
    'Free offline-first Bodo ↔ English dictionary. 10,000+ dictionary entries and 21,000+ subject glossary terms.',
  keywords: ['Bodo', 'BRX', 'dictionary', 'Devanagari', 'Assam', 'Northeast India'],
  openGraph: {
    siteName: 'Thunlai',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">Thunlai</span>
              <span className="hidden text-sm text-gray-500 sm:block">Bodo Dictionary</span>
            </a>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="/browse/अ" className="hover:text-primary">Browse</a>
              <a
                href="https://apps.apple.com"
                className="rounded-full bg-primary px-4 py-1.5 text-white hover:bg-primary-dark"
              >
                Get the app
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-gray-200 py-8 text-center text-xs text-gray-400">
          Data © Bodo Sahitya Sabha · bihung.org · CC BY-SA 4.0
        </footer>
      </body>
    </html>
  );
}
