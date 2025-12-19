"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Image,
  Gamepad2,
  Ticket,
  Users,
  LogOut,
  Loader2,
  Home,
  FolderTree,
  Database,
  Menu,
  X,
  Star,
  Video,
  BarChart,
  MessageSquare,
  Newspaper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user, loading: authLoading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [authLoading, adminLoading, user, isAdmin, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isAdmin) {
      loadCounts();

      const reviewsChannel = supabase
        .channel('admin-reviews')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'customer_reviews',
        }, () => {
          loadCounts();
        })
        .subscribe();

      const messagesChannel = supabase
        .channel('admin-messages')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'contact_messages',
        }, () => {
          loadCounts();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(reviewsChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [isAdmin]);

  const loadCounts = async () => {
    try {
      const { count: reviewsCount } = await supabase
        .from('customer_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      const { count: messagesCount } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      setPendingReviewsCount(reviewsCount || 0);
      setUnreadMessagesCount(messagesCount || 0);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Tableau de bord', badge: 0 },
    { href: '/admin/analytics', icon: BarChart, label: 'Analytics', badge: 0 },
    { href: '/admin/products', icon: Package, label: 'Produits', badge: 0 },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Commandes', badge: 0 },
    { href: '/admin/actualites', icon: Newspaper, label: 'Actualités', badge: 0 },
    { href: '/admin/contact-messages', icon: MessageSquare, label: 'Messages de contact', badge: unreadMessagesCount },
    { href: '/admin/reviews', icon: Star, label: 'Avis clients', badge: pendingReviewsCount },
    { href: '/admin/slides', icon: Image, label: 'Slides Accueil', badge: 0 },
    { href: '/admin/live-streams', icon: Video, label: 'Live Streams', badge: 0 },
    { href: '/admin/featured-products', icon: Star, label: 'Produits Vedette', badge: 0 },
    { href: '/admin/home-categories', icon: FolderTree, label: 'Catégories Accueil', badge: 0 },
    { href: '/admin/games', icon: Gamepad2, label: 'Gestion des Jeux', badge: 0 },
    { href: '/admin/coupons', icon: Ticket, label: 'Coupons', badge: 0 },
    { href: '/admin/customers', icon: Users, label: 'Clients', badge: 0 },
    { href: '/admin/backups', icon: Database, label: 'Sauvegardes', badge: 0 },
  ];

  const handleBackToSite = () => {
    router.push('/');
  };

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-sm ${
              isActive ? 'bg-blue-800 font-medium' : 'hover:bg-blue-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {item.badge > 0 && (
              <Badge className="bg-red-500 text-white hover:bg-red-600 ml-2">
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="hidden lg:block w-64 bg-blue-900 text-white min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-8">Administration</h1>
            <nav className="space-y-1">
              <NavLinks />
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
            <Button
              onClick={handleBackToSite}
              variant="outline"
              className="w-full bg-transparent text-white border-white hover:bg-blue-800 hover:text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Retour au site
            </Button>
            <Button
              onClick={signOut}
              variant="outline"
              className="w-full bg-transparent text-white border-white hover:bg-blue-800 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </aside>

        <div className="lg:hidden fixed top-0 left-0 right-0 bg-blue-900 text-white z-40 px-4 py-3 flex items-center justify-between shadow-lg">
          <h1 className="text-xl font-bold">Administration</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="text-white hover:bg-blue-800"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 bg-blue-900 text-white border-none p-0">
            <SheetHeader className="p-6 pb-4">
              <SheetTitle className="text-white text-2xl font-bold text-left">Administration</SheetTitle>
            </SheetHeader>
            <nav className="space-y-1 px-6">
              <NavLinks />
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
              <Button
                onClick={handleBackToSite}
                variant="outline"
                className="w-full bg-transparent text-white border-white hover:bg-blue-800 hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour au site
              </Button>
              <Button
                onClick={signOut}
                variant="outline"
                className="w-full bg-transparent text-white border-white hover:bg-blue-800 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
