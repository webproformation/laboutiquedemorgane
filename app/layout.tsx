import './globals.css';
import type { Metadata } from 'next';
import { Oxygen, Dancing_Script } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import { LoyaltyProvider } from '@/context/LoyaltyContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ApolloWrapper from '@/components/ApolloProvider';
import {
  EuroLoyaltyProgressBar,
  DailyConnectionReward,
  PageVisitTracker,
  AnalyticsTracker,
  ScrollToTop,
  CookieConsent,
  CookiePreferencesButton,
  Toaster,
} from '@/components/ClientComponents';

const oxygen = Oxygen({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'La Boutique de Morgane - Live Shopping',
  description: 'Boutique en ligne avec live shopping interactif',
  icons: {
    icon: '/favicon.ico',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: '#D4AF37',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${oxygen.className} overflow-x-hidden`}>
        <ApolloWrapper>
          <AuthProvider>
            <LoyaltyProvider>
              <CartProvider>
                <WishlistProvider>
                  <DailyConnectionReward />
                  <PageVisitTracker />
                  <AnalyticsTracker />
                  <div className="flex flex-col min-h-screen overflow-x-hidden">
                    <Header />
                    <EuroLoyaltyProgressBar />
                    <main className="flex-1 bg-gray-50">{children}</main>
                    <Footer />
                  </div>
                  <ScrollToTop />
                  <CookieConsent />
                  <CookiePreferencesButton />
                  <Toaster />
                </WishlistProvider>
              </CartProvider>
            </LoyaltyProvider>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
