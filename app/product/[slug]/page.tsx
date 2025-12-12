"use client";

import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_BY_SLUG } from '@/lib/queries';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { GetProductBySlugResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ShoppingCart, Home, Heart, Bell } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState, use } from 'react';
import ProductGallery from '@/components/ProductGallery';
import ShareButtons from '@/components/ShareButtons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice, formatAttributeName } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = use(params);
  const slug = decodeURIComponent(rawSlug);
  const { loading, error, data } = useQuery<GetProductBySlugResponse>(GET_PRODUCT_BY_SLUG, {
    variables: { slug },
  });
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user, profile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="mb-6 h-5 w-64" />
          <div className="grid gap-8 lg:grid-cols-2 bg-white p-6 rounded-lg">
            <div className="space-y-4">
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
              <div className="grid grid-cols-6 gap-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4]" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Produit introuvable ou erreur de chargement.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const product = data.product;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${quantity} × ${product.name} ajouté au panier !`);
  };

  const handleToggleWishlist = async () => {
    try {
      if (isInWishlist(product.slug)) {
        await removeFromWishlist(product.slug);
        toast.success(`${product.name} retiré de la wishlist`);
      } else {
        await addToWishlist(product);
        toast.success(`${product.name} ajouté à la wishlist !`);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  const handleNotifyAvailability = async () => {
    if (!user && !notifyEmail) {
      setShowNotifyDialog(true);
      return;
    }

    setIsSubmittingNotification(true);

    try {
      const { error } = await supabase
        .from('product_availability_notifications')
        .insert({
          user_id: user?.id || null,
          product_slug: product.slug,
          product_name: product.name,
          email: user ? profile?.email : notifyEmail,
        });

      if (error) throw error;

      toast.success('Vous serez notifié quand ce produit sera de nouveau disponible !');
      setShowNotifyDialog(false);
      setNotifyEmail('');
    } catch (error) {
      toast.error('Erreur lors de l\'inscription à la notification');
    } finally {
      setIsSubmittingNotification(false);
    }
  };

  const inWishlist = isInWishlist(product.slug);
  const galleryImages = product.galleryImages?.nodes || [];
  const allImages = product.image ? [product.image, ...galleryImages] : galleryImages;

  return (
    <>
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Être notifié de la disponibilité</DialogTitle>
            <DialogDescription>
              Recevez un email dès que {product.name} sera de nouveau en stock.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleNotifyAvailability}
              disabled={!notifyEmail || isSubmittingNotification}
            >
              {isSubmittingNotification ? 'Inscription...' : 'Me notifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-[#b8933d] flex items-center gap-1">
            <Home className="h-4 w-4" />
            Accueil
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-10">
            <div>
              <ProductGallery images={allImages} productName={product.name} />
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-3 flex-wrap">
                  {product.onSale && product.regularPrice ? (
                    <>
                      <p className="text-2xl text-gray-500 line-through">
                        {formatPrice(product.regularPrice)}
                      </p>
                      <p className="text-3xl lg:text-4xl font-bold text-[#305F69]">
                        {formatPrice(product.price)}
                      </p>
                      <span className="bg-[#DF30CF] text-white px-3 py-1 rounded-full text-sm font-bold">
                        PROMO
                      </span>
                    </>
                  ) : (
                    <p className="text-3xl lg:text-4xl font-bold text-[#b8933d]">
                      {formatPrice(product.price)}
                    </p>
                  )}
                </div>
              </div>

              {product.stockQuantity !== null && product.stockQuantity !== undefined && (
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      product.stockQuantity > 0 ? 'bg-[#B6914A]' : 'bg-[#DF30CF]'
                    }`}
                  />
                  <p className="text-sm font-medium">
                    {product.stockQuantity > 0 ? (
                      <span className="text-[#B6914A]">Produit disponible</span>
                    ) : (
                      <span className="text-[#DF30CF]">Rupture de stock</span>
                    )}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    Quantité:
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-gray-50 transition-colors"
                      aria-label="Diminuer la quantité"
                    >
                      -
                    </button>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 hover:bg-gray-50 transition-colors"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>

                {product.stockQuantity === 0 ? (
                  <Button
                    onClick={handleNotifyAvailability}
                    className="w-full bg-[#B6914A] hover:bg-[#a07c2f] text-white h-12 text-lg font-semibold"
                  >
                    <Bell className="mr-2 h-5 w-5" />
                    Me notifier quand disponible
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white h-12 text-lg font-semibold"
                    disabled={product.stockQuantity === undefined}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Ajouter au panier
                  </Button>
                )}

                <div className="flex gap-3">
                  <Button
                    variant={inWishlist ? "default" : "outline"}
                    className={`flex-1 ${
                      inWishlist
                        ? 'bg-[#DF30CF] hover:bg-[#c82bb7] text-white border-[#DF30CF]'
                        : 'border-gray-300'
                    }`}
                    onClick={handleToggleWishlist}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
                    {inWishlist ? 'Dans la wishlist' : 'Wishlist'}
                  </Button>
                  <ShareButtons
                    title={product.name}
                    description={product.description || ''}
                    imageUrl={product.image?.sourceUrl}
                    price={formatPrice(product.price)}
                  />
                </div>
              </div>

              {(product.attributes?.nodes && product.attributes.nodes.length > 0) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Caractéristiques</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {product.attributes.nodes.map((attr: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-40">
                          <span className="text-sm font-medium text-gray-700">{formatAttributeName(attr.name)} :</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2">
                            {attr.options?.map((option: string, optIndex: number) => (
                              <span
                                key={optIndex}
                                className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
                              >
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.description && (
                <Accordion type="single" collapsible defaultValue="description" className="border-t">
                  <AccordionItem value="description">
                    <AccordionTrigger className="text-lg font-semibold hover:text-[#b8933d]">
                      Description
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        className="prose prose-sm text-gray-600 max-w-none"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="composition">
                    <AccordionTrigger className="text-lg font-semibold hover:text-[#b8933d]">
                      Composition & Entretien
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-gray-600 space-y-2">
                        <p>Composition à définir dans WordPress</p>
                        <p className="text-sm">Lavage: Suivre les instructions sur l&apos;étiquette</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="shipping">
                    <AccordionTrigger className="text-lg font-semibold hover:text-[#b8933d]">
                      Livraison & Retours
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-gray-600 space-y-2">
                        <p>Livraison standard: 3-5 jours ouvrés</p>
                        <p>Retours gratuits sous 30 jours</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
