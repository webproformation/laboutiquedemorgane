import './globals.css';
import type { Metadata } from 'next';
import { Oxygen } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import { LoyaltyProvider } from '@/context/LoyaltyContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoyaltyProgressBar from '@/components/LoyaltyProgressBar';
import PageVisitTracker from '@/components/PageVisitTracker';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import ScrollToTop from '@/components/ScrollToTop';
import CookieConsent from '@/components/CookieConsent';
import CookiePreferencesButton from '@/components/CookiePreferencesButton';
import { Toaster } from '@/components/ui/sonner';
import ApolloWrapper from '@/components/ApolloProvider';

const oxygen = Oxygen({
  weight: ['300', '400', '700'],
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'La Boutique de Morgane - Live Shopping',
  description: 'Boutique en ligne avec live shopping interactif',
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
                  <PageVisitTracker />
                  <AnalyticsTracker />
                  <div className="flex flex-col min-h-screen overflow-x-hidden">
                    <Header />
                    <LoyaltyProgressBar />
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
