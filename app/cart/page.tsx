"use client";

import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { formatPrice, parsePrice } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MINIMUM_ORDER_AMOUNT = 10;

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-24 w-24 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Votre panier est vide</h1>
        <p className="mt-2 text-gray-600">Commencez vos achats dès maintenant !</p>
        <Link href="/">
          <Button className="mt-6 bg-[#b8933d] hover:bg-[#a07c2f] text-white">
            Découvrir nos produits
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-[#b8933d]"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Continuer mes achats
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-gray-900">Mon Panier</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const price = parsePrice(item.price);
            const total = price * item.quantity;

            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {item.image?.sourceUrl ? (
                        <Image
                          src={item.image.sourceUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="mt-1 text-sm font-medium text-[#b8933d]">{formatPrice(item.price)}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center space-x-4">
                          <p className="font-semibold text-gray-900">
                            {total.toFixed(2)} €
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#DF30CF] hover:text-[#c82bb7] hover:bg-pink-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button
            variant="outline"
            onClick={clearCart}
            className="mt-4 text-[#DF30CF] hover:text-[#c82bb7]"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Vider le panier
          </Button>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Récapitulatif</h2>
              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{cartTotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de port</span>
                  <span className="font-medium">Calculés à l&apos;étape suivante</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[#b8933d]">{cartTotal.toFixed(2)} €</span>
              </div>

              {cartTotal < MINIMUM_ORDER_AMOUNT && (
                <Alert className="bg-orange-50 border-orange-200">
                  <Info className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-sm text-orange-800">
                    Montant minimum : {MINIMUM_ORDER_AMOUNT.toFixed(2)} €<br />
                    Il vous manque {(MINIMUM_ORDER_AMOUNT - cartTotal).toFixed(2)} €
                  </AlertDescription>
                </Alert>
              )}

              <Link href="/checkout" className="block">
                <Button
                  className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white"
                  size="lg"
                  disabled={cartTotal < MINIMUM_ORDER_AMOUNT}
                >
                  Passer la commande
                </Button>
              </Link>

              <p className="text-center text-xs text-gray-500">
                Paiement sécurisé
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
