"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem, Product } from '@/types';
import { parsePrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();
  const [previousUserId, setPreviousUserId] = useState<string | undefined>(undefined);

  const loadCartFromSupabase = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error loading cart from Supabase:', error);
        }
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((item: any) => {
        const variationData = item.variation_data || {};
        return {
          id: item.product_id,
          name: item.product_name,
          slug: item.product_slug,
          price: item.product_price,
          image: item.product_image_url ? { sourceUrl: item.product_image_url } : null,
          quantity: item.quantity,
          variationId: variationData.variationId || null,
          variationPrice: variationData.variationPrice || null,
          variationImage: variationData.variationImage || null,
          selectedAttributes: variationData.selectedAttributes || {},
        };
      });
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }, [user]);

  const syncCartToSupabase = useCallback(async (cartItems: CartItem[]) => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (cartItems.length > 0) {
        const itemsToInsert = cartItems.map((item) => ({
          user_id: user.id,
          product_id: item.id,
          product_name: item.name,
          product_slug: item.slug,
          product_price: item.variationPrice || item.price,
          product_image_url: item.image?.sourceUrl || null,
          quantity: item.quantity,
          variation_data: (item.variationId || item.selectedAttributes) ? {
            variationId: item.variationId || null,
            variationPrice: item.variationPrice || null,
            variationImage: item.variationImage || null,
            selectedAttributes: item.selectedAttributes || null,
          } : null,
        }));

        await supabase.from('cart_items').insert(itemsToInsert);
      }
    } catch (error) {
      console.error('Error syncing cart to Supabase:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing]);

  useEffect(() => {
    if (previousUserId !== user?.id) {
      setIsInitialized(false);
      setPreviousUserId(user?.id);
    }
  }, [user?.id, previousUserId]);

  useEffect(() => {
    const initializeCart = async () => {
      if (isInitialized) return;

      const localCart = localStorage.getItem('cart');
      const localCartItems: CartItem[] = localCart ? JSON.parse(localCart) : [];

      if (user?.id) {
        try {
          const supabaseCart = await loadCartFromSupabase();

          const mergedCart = [...supabaseCart];
          localCartItems.forEach((localItem) => {
            const existingItem = mergedCart.find((item) => item.id === localItem.id);
            if (existingItem) {
              existingItem.quantity = Math.max(existingItem.quantity, localItem.quantity);
            } else {
              mergedCart.push({
                ...localItem,
                image: localItem.image || null,
                variationId: localItem.variationId || null,
                variationPrice: localItem.variationPrice || null,
                variationImage: localItem.variationImage || null,
                selectedAttributes: localItem.selectedAttributes || {},
              } as any);
            }
          });

          setCart(mergedCart);

          if (mergedCart.length > 0 && localCartItems.length > 0) {
            await syncCartToSupabase(mergedCart);
          }

          localStorage.removeItem('cart');
        } catch (error) {
          console.error('Error initializing cart:', error);
          setCart(localCartItems);
        }
      } else {
        setCart(localCartItems);
      }

      setIsInitialized(true);
    };

    initializeCart();
  }, [user?.id, loadCartFromSupabase, syncCartToSupabase, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    if (user) {
      syncCartToSupabase(cart);
    } else {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized, user, syncCartToSupabase]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = parsePrice(item.variationPrice || item.price);
    return total + price * item.quantity;
  }, 0);

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
