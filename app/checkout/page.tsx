"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { MapPin, ShoppingBag, Loader2, Plus, ArrowLeft, Truck, CreditCard, Clock, Info, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, parsePrice } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GDPRConsent from '@/components/GDPRConsent';
import dynamic from 'next/dynamic';

const MondialRelaySelector = dynamic(
  () => import('@/components/MondialRelaySelector'),
  {
    loading: () => (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#b8933d] mr-2" />
            <span className="text-gray-600">Chargement du sélecteur de point relais...</span>
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false
  }
);

const CouponSelector = dynamic(
  () => import('@/components/CouponSelector'),
  {
    loading: () => (
      <div className="py-2">
        <Loader2 className="h-4 w-4 animate-spin text-[#b8933d]" />
      </div>
    ),
    ssr: false
  }
);

interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface ShippingMethod {
  id: string;
  zone_id: number;
  zone_name: string;
  instance_id: number;
  method_id: string;
  title: string;
  cost: string;
  description: string;
}

interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface TaxRate {
  id: number;
  country: string;
  state: string;
  rate: string;
  name: string;
  shipping: boolean;
  class: string;
}

interface UserCoupon {
  id: string;
  code: string;
  coupon_type_id: string;
  source: string;
  is_used: boolean;
  used_at: string | null;
  obtained_at: string;
  valid_until: string;
  coupon_types: {
    id: string;
    code: string;
    type: string;
    value: number;
    description: string;
    valid_until: string;
  };
}

const MINIMUM_ORDER_AMOUNT = 10;

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [useDeliveryBatch, setUseDeliveryBatch] = useState(false);
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState<string>('none');
  const [selectedRelayPoint, setSelectedRelayPoint] = useState<any>(null);

  const insuranceOptions = [
    { id: 'none', label: 'Sans assurance', description: 'Pas de protection supplémentaire', price: 0 },
    { id: 'standard', label: 'Assurance standard', description: 'Protection contre la casse et la perte', price: 2.99 },
    { id: 'premium', label: 'Assurance premium', description: 'Protection complète + remboursement express', price: 4.99 },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (cart.length === 0) {
      router.push('/cart');
      return;
    }

    loadCheckoutData();
  }, [user, cart]);

  const loadCheckoutData = async () => {
    if (!user) return;

    try {
      // Load checkout options and addresses in parallel
      await Promise.all([
        loadAddresses(),
        loadCheckoutOptions(),
        checkActiveBatch(),
      ]);

      // Check customer status directly from Supabase
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('blocked, blocked_reason')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profile && profile.blocked) {
          toast.error(profile.blocked_reason || 'Votre compte est bloqué. Contactez le service client.');
          router.push('/account');
          return;
        }
      } catch (statusError) {
        console.error('Error checking customer status:', statusError);
        // Continue with checkout even if status check fails
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      toast.error('Erreur lors du chargement des données. Veuillez réessayer.');
    }

    setLoading(false);
  };

  const checkActiveBatch = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('delivery_batches')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gte('validate_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setActiveBatch(data);
        setUseDeliveryBatch(true);
      }
    } catch (error) {
      console.error('Error checking active batch:', error);
    }
  };

  const loadAddresses = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setAddresses(data);
      const defaultAddress = data.find((addr) => addr.is_default);
      setSelectedAddressId(defaultAddress?.id || data[0].id);
    }
  };

  const loadCheckoutOptions = async () => {
    try {
      const cacheKey = 'checkout_options_cache';
      const cacheTimeKey = 'checkout_options_cache_time';
      const cacheExpiry = 60 * 60 * 1000;

      const cachedTime = localStorage.getItem(cacheTimeKey);
      const now = Date.now();

      if (cachedTime && now - parseInt(cachedTime) < cacheExpiry) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          setShippingMethods(data.shippingMethods || []);
          setPaymentGateways(data.paymentGateways || []);
          setTaxRates(data.taxRates || []);

          if (data.shippingMethods && data.shippingMethods.length > 0) {
            const availableMethods = data.shippingMethods.filter((m: ShippingMethod) => m.method_id !== 'free_shipping');
            if (availableMethods.length > 0) {
              setSelectedShippingMethod(availableMethods[0].id);
            }
          }

          if (data.paymentGateways && data.paymentGateways.length > 0) {
            setSelectedPaymentMethod(data.paymentGateways[0].id);
          }
          return;
        }
      }

      const response = await fetch('/api/woocommerce/checkout-options');

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, now.toString());

        setShippingMethods(data.shippingMethods || []);
        setPaymentGateways(data.paymentGateways || []);
        setTaxRates(data.taxRates || []);

        if (data.shippingMethods && data.shippingMethods.length > 0) {
          const availableMethods = data.shippingMethods.filter((m: ShippingMethod) => m.method_id !== 'free_shipping');
          if (availableMethods.length > 0) {
            setSelectedShippingMethod(availableMethods[0].id);
          }
        }

        if (data.paymentGateways && data.paymentGateways.length > 0) {
          setSelectedPaymentMethod(data.paymentGateways[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading checkout options:', error);
    }
  };

  const calculateShippingCost = () => {
    if (selectedCoupon?.coupon_types.type === 'free_delivery') {
      return 0;
    }
    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    return method ? parseFloat(method.cost) : 0;
  };

  const calculateInsuranceCost = () => {
    const insurance = insuranceOptions.find(opt => opt.id === selectedInsurance);
    return insurance ? insurance.price : 0;
  };

  const calculateDiscount = () => {
    if (!selectedCoupon) return 0;

    const couponType = selectedCoupon.coupon_types;
    if (couponType.type === 'discount_amount') {
      return Math.min(couponType.value, cartTotal);
    } else if (couponType.type === 'discount_percentage') {
      return (cartTotal * couponType.value) / 100;
    } else if (couponType.type === 'free_delivery') {
      const method = shippingMethods.find(m => m.id === selectedShippingMethod);
      return method ? parseFloat(method.cost) : 0;
    }
    return 0;
  };

  const calculateTax = () => {
    const TAX_RATE = 20;
    const subtotalAfterDiscount = cartTotal - calculateDiscount();
    const totalWithShippingAndInsurance = subtotalAfterDiscount + calculateShippingCost() + calculateInsuranceCost();
    const taxAmount = totalWithShippingAndInsurance * (TAX_RATE / (100 + TAX_RATE));
    return taxAmount;
  };

  const calculateTotal = () => {
    const subtotalAfterDiscount = cartTotal - calculateDiscount();
    return subtotalAfterDiscount + calculateShippingCost() + calculateInsuranceCost();
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `CMD-${timestamp}-${random}`;
  };

  const createDeliveryBatch = async () => {
    if (cartTotal < MINIMUM_ORDER_AMOUNT) {
      toast.error(`Le montant minimum de commande est de ${MINIMUM_ORDER_AMOUNT.toFixed(2)} €`);
      return;
    }

    if (!selectedAddressId) {
      toast.error('Veuillez sélectionner une adresse de livraison');
      return;
    }

    if (!selectedShippingMethod) {
      toast.error('Veuillez sélectionner un mode de livraison');
      return;
    }

    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    const isRelayDelivery = method?.title?.toLowerCase().includes('relais') ||
                           method?.title?.toLowerCase().includes('locker') ||
                           method?.description?.toLowerCase().includes('relais') ||
                           method?.description?.toLowerCase().includes('locker');

    if (isRelayDelivery && !selectedRelayPoint) {
      toast.error('Veuillez sélectionner un point relais');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
    }

    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const shippingCost = calculateShippingCost();
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
      const selectedShipping = shippingMethods.find(m => m.id === selectedShippingMethod);

      const items = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_slug: item.slug,
        quantity: item.quantity,
        unit_price: parsePrice(item.price),
        total_price: parsePrice(item.price) * item.quantity,
        image_url: item.image?.sourceUrl || null,
      }));

      let batchId = activeBatch?.id;
      let paymentAmount = cartTotal;
      const selectedPaymentGateway = paymentGateways.find(g => g.id === selectedPaymentMethod);

      // Si c'est la première commande avec livraison groupée
      if (!activeBatch) {
        // Payer produits + frais de livraison
        paymentAmount = cartTotal + shippingCost;

        let paymentIntentId = null;

        // Si c'est Stripe, créer un Payment Intent
        if (selectedPaymentMethod === 'stripe') {
          const paymentResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: Math.round(paymentAmount * 100),
                currency: 'eur',
                description: 'Mon colis ouvert - Première commande',
              }),
            }
          );

          if (!paymentResponse.ok) {
            throw new Error('Erreur lors de la création du paiement');
          }

          const paymentData = await paymentResponse.json();
          paymentIntentId = paymentData.paymentIntentId;
        }

        // Créer le batch
        const { data: newBatch, error: batchError } = await supabase
          .from('delivery_batches')
          .insert({
            user_id: user!.id,
            shipping_cost: shippingCost,
            shipping_address_id: selectedAddressId,
            status: 'pending',
          })
          .select()
          .single();

        if (batchError) throw batchError;
        batchId = newBatch.id;

        // Créer commande WooCommerce
        const wooOrderData = {
          status: selectedPaymentMethod === 'stripe' ? 'processing' : 'pending',
          payment_method: selectedPaymentMethod,
          payment_method_title: selectedPaymentGateway?.title || 'Paiement',
          set_paid: selectedPaymentMethod === 'stripe',
          billing: {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedAddress!.address_line1,
            address_2: selectedAddress!.address_line2 || '',
            city: selectedAddress!.city,
            postcode: selectedAddress!.postal_code,
            country: selectedAddress!.country,
            email: user!.email || '',
            phone: selectedAddress!.phone,
          },
          shipping: selectedRelayPoint ? {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
            address_2: selectedRelayPoint.LgAdr2 || '',
            city: selectedRelayPoint.Ville,
            postcode: selectedRelayPoint.CP,
            country: selectedRelayPoint.Pays,
          } : {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedAddress!.address_line1,
            address_2: selectedAddress!.address_line2 || '',
            city: selectedAddress!.city,
            postcode: selectedAddress!.postal_code,
            country: selectedAddress!.country,
          },
          line_items: items.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: item.quantity,
          })),
          shipping_lines: [{
            method_id: selectedShipping!.method_id,
            method_title: 'Mon colis ouvert (5 jours)',
            total: shippingCost.toString(),
          }],
          meta_data: [
            {
              key: '_supabase_batch_id',
              value: batchId,
            },
            ...(paymentIntentId ? [{
              key: '_stripe_payment_intent_id',
              value: paymentIntentId,
            }] : []),
            ...(selectedRelayPoint ? [
              {
                key: '_mondial_relay_id',
                value: selectedRelayPoint.Num,
              },
              {
                key: '_mondial_relay_name',
                value: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
              },
              {
                key: '_mondial_relay_address',
                value: `${selectedRelayPoint.LgAdr3 || ''} ${selectedRelayPoint.CP} ${selectedRelayPoint.Ville}`,
              },
            ] : []),
          ],
        };

        const wooResponse = await fetch('/api/woocommerce/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderData: wooOrderData,
              localOrderId: null,
            }),
          }
        );

        if (!wooResponse.ok) {
          const errorText = await wooResponse.text();
          console.error('WooCommerce order creation failed:', errorText);
          throw new Error('Erreur lors de la création de la commande WooCommerce');
        }

        const wooResult = await wooResponse.json();

        // Mettre à jour le batch avec l'ID WooCommerce
        const { error: updateError } = await supabase
          .from('delivery_batches')
          .update({
            woocommerce_order_id: wooResult.woocommerceOrderId?.toString(),
          })
          .eq('id', batchId);

        if (updateError) {
          console.error('Failed to update batch with WooCommerce order ID:', updateError);
        }

      } else {
        // Commande suivante : payer uniquement les produits
        paymentAmount = cartTotal;

        let paymentIntentId = null;

        // Si c'est Stripe, créer un Payment Intent
        if (selectedPaymentMethod === 'stripe') {
          const paymentResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: Math.round(paymentAmount * 100),
                currency: 'eur',
                description: 'Mon colis ouvert - Produits supplémentaires',
              }),
            }
          );

          if (!paymentResponse.ok) {
            throw new Error('Erreur lors de la création du paiement');
          }

          const paymentData = await paymentResponse.json();
          paymentIntentId = paymentData.paymentIntentId;
        }

        // Créer commande WooCommerce pour les nouveaux produits
        const wooOrderData = {
          status: selectedPaymentMethod === 'stripe' ? 'processing' : 'pending',
          payment_method: selectedPaymentMethod,
          payment_method_title: selectedPaymentGateway?.title || 'Paiement',
          set_paid: selectedPaymentMethod === 'stripe',
          billing: {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedAddress!.address_line1,
            address_2: selectedAddress!.address_line2 || '',
            city: selectedAddress!.city,
            postcode: selectedAddress!.postal_code,
            country: selectedAddress!.country,
            email: user!.email || '',
            phone: selectedAddress!.phone,
          },
          shipping: selectedRelayPoint ? {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
            address_2: selectedRelayPoint.LgAdr2 || '',
            city: selectedRelayPoint.Ville,
            postcode: selectedRelayPoint.CP,
            country: selectedRelayPoint.Pays,
          } : {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedAddress!.address_line1,
            address_2: selectedAddress!.address_line2 || '',
            city: selectedAddress!.city,
            postcode: selectedAddress!.postal_code,
            country: selectedAddress!.country,
          },
          line_items: items.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: item.quantity,
          })),
          shipping_lines: [{
            method_id: 'flat_rate',
            method_title: 'Mon colis ouvert (déjà payée)',
            total: '0',
          }],
          meta_data: [
            {
              key: '_supabase_batch_id',
              value: batchId,
            },
            ...(paymentIntentId ? [{
              key: '_stripe_payment_intent_id',
              value: paymentIntentId,
            }] : []),
            ...(selectedRelayPoint ? [
              {
                key: '_mondial_relay_id',
                value: selectedRelayPoint.Num,
              },
              {
                key: '_mondial_relay_name',
                value: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
              },
              {
                key: '_mondial_relay_address',
                value: `${selectedRelayPoint.LgAdr3 || ''} ${selectedRelayPoint.CP} ${selectedRelayPoint.Ville}`,
              },
            ] : []),
          ],
        };

        const wooResponse = await fetch('/api/woocommerce/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderData: wooOrderData,
              localOrderId: null,
            }),
          }
        );

        if (!wooResponse.ok) {
          const errorText = await wooResponse.text();
          console.error('WooCommerce order creation failed:', errorText);
          throw new Error('Erreur lors de la création de la commande WooCommerce');
        }
      }

      // Ajouter les items au batch
      const batchItems = items.map(item => ({
        ...item,
        batch_id: batchId,
      }));

      const { error: itemsError } = await supabase
        .from('delivery_batch_items')
        .insert(batchItems);

      if (itemsError) throw itemsError;

      clearCart();
      toast.success('Articles ajoutés à votre colis ouvert !');
      router.push('/account/pending-deliveries');
    } catch (error) {
      console.error('Error creating delivery batch:', error);
      toast.error('Erreur lors de la création du colis ouvert');
    } finally {
      setProcessing(false);
    }
  };

  const proceedToPayment = async () => {
    if (!gdprConsent) {
      setGdprError('Vous devez accepter les conditions pour valider votre commande');
      toast.error('Veuillez accepter les conditions générales de vente');
      return;
    }

    setGdprError('');

    if (cartTotal < MINIMUM_ORDER_AMOUNT) {
      toast.error(`Le montant minimum de commande est de ${MINIMUM_ORDER_AMOUNT.toFixed(2)} €`);
      return;
    }

    if (useDeliveryBatch) {
      await createDeliveryBatch();
      return;
    }

    if (!selectedAddressId) {
      toast.error('Veuillez sélectionner une adresse de livraison');
      return;
    }

    if (!selectedShippingMethod) {
      toast.error('Veuillez sélectionner un mode de livraison');
      return;
    }

    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    const isRelayDelivery = method?.title?.toLowerCase().includes('relais') ||
                           method?.title?.toLowerCase().includes('locker') ||
                           method?.description?.toLowerCase().includes('relais') ||
                           method?.description?.toLowerCase().includes('locker');

    if (isRelayDelivery && !selectedRelayPoint) {
      toast.error('Veuillez sélectionner un point relais');
      return;
    }

    setProcessing(true);

    try {
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
      const selectedShipping = shippingMethods.find(m => m.id === selectedShippingMethod);
      const orderNumber = generateOrderNumber();
      const shippingCost = calculateShippingCost();
      const taxAmount = calculateTax();
      const totalAmount = calculateTotal();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          order_number: orderNumber,
          status: 'processing',
          total_amount: totalAmount,
          shipping_address: selectedAddress,
          shipping_method_id: selectedShippingMethod,
          shipping_cost: shippingCost,
          tax_amount: taxAmount,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        product_slug: item.slug,
        product_image: item.image?.sourceUrl || '',
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error('Erreur lors de l\'enregistrement des articles');
      }

      if (selectedCoupon) {
        await supabase
          .from('user_coupons')
          .update({
            is_used: true,
            used_at: new Date().toISOString(),
            order_id: order.id,
          })
          .eq('id', selectedCoupon.id);
      }

      const { data: { session } } = await supabase.auth.getSession();

      const wooOrderData = {
        payment_method: 'bacs',
        payment_method_title: 'Virement bancaire',
        set_paid: false,
        billing: {
          first_name: selectedAddress!.first_name,
          last_name: selectedAddress!.last_name,
          address_1: selectedAddress!.address_line1,
          address_2: selectedAddress!.address_line2 || '',
          city: selectedAddress!.city,
          postcode: selectedAddress!.postal_code,
          country: selectedAddress!.country,
          email: user!.email || '',
          phone: selectedAddress!.phone,
        },
        shipping: selectedRelayPoint ? {
          first_name: selectedAddress!.first_name,
          last_name: selectedAddress!.last_name,
          address_1: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
          address_2: selectedRelayPoint.LgAdr2 || '',
          city: selectedRelayPoint.Ville,
          postcode: selectedRelayPoint.CP,
          country: selectedRelayPoint.Pays,
        } : {
          first_name: selectedAddress!.first_name,
          last_name: selectedAddress!.last_name,
          address_1: selectedAddress!.address_line1,
          address_2: selectedAddress!.address_line2 || '',
          city: selectedAddress!.city,
          postcode: selectedAddress!.postal_code,
          country: selectedAddress!.country,
        },
        line_items: cart.map(item => ({
          product_id: item.databaseId || parseInt(item.id) || 0,
          quantity: item.quantity,
        })),
        shipping_lines: [{
          method_id: selectedShipping!.method_id,
          method_title: selectedShipping!.title,
          total: selectedShipping!.cost,
        }],
        meta_data: [
          ...(selectedRelayPoint ? [
            {
              key: '_mondial_relay_id',
              value: selectedRelayPoint.Num,
            },
            {
              key: '_mondial_relay_name',
              value: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
            },
            {
              key: '_mondial_relay_address',
              value: `${selectedRelayPoint.LgAdr3 || ''} ${selectedRelayPoint.CP} ${selectedRelayPoint.Ville}`,
            },
          ] : []),
        ],
      };

      const wooResponse = await fetch('/api/woocommerce/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wooOrderData),
      });

      if (!wooResponse.ok) {
        const errorText = await wooResponse.text();
        console.error('WooCommerce order creation failed:', errorText);
        throw new Error('Erreur lors de la création de la commande WooCommerce');
      }

      clearCart();
      toast.success('Commande validée avec succès !');
      router.push(`/order-confirmation/${orderNumber}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Une erreur est survenue lors de la commande');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/cart"
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-[#b8933d]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour au panier
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Validation de la commande
        </h1>

        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#b8933d]" />
                    Adresse de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        Vous n'avez pas encore d'adresse de livraison
                      </p>
                      <Button
                        onClick={() => router.push('/account/addresses')}
                        className="bg-[#b8933d] hover:bg-[#a07c2f]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une adresse
                      </Button>
                    </div>
                  ) : (
                    <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                      <div className="space-y-4">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                              selectedAddressId === address.id
                                ? 'border-[#b8933d] bg-[#b8933d]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedAddressId(address.id)}
                          >
                            <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={address.id} className="cursor-pointer">
                                <div className="space-y-1">
                                  {address.label && (
                                    <p className="font-semibold text-gray-900">{address.label}</p>
                                  )}
                                  <p className="text-sm text-gray-900">
                                    {address.first_name} {address.last_name}
                                  </p>
                                  <p className="text-sm text-gray-600">{address.address_line1}</p>
                                  {address.address_line2 && (
                                    <p className="text-sm text-gray-600">{address.address_line2}</p>
                                  )}
                                  <p className="text-sm text-gray-600">
                                    {address.postal_code} {address.city}
                                  </p>
                                  <p className="text-sm text-gray-600">{address.country}</p>
                                  <p className="text-sm text-gray-600">{address.phone}</p>
                                </div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}

                  {addresses.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => router.push('/account/addresses')}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une nouvelle adresse
                    </Button>
                  )}
                </CardContent>
              </Card>

              {shippingMethods.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-[#b8933d]" />
                      Mode de livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedShippingMethod} onValueChange={(value) => {
                      setSelectedShippingMethod(value);
                      setSelectedRelayPoint(null);
                    }}>
                      <div className="space-y-4">
                        {shippingMethods.filter(method => method.method_id !== 'free_shipping').map((method) => (
                          <div
                            key={method.id}
                            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                              selectedShippingMethod === method.id
                                ? 'border-[#b8933d] bg-[#b8933d]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setSelectedShippingMethod(method.id);
                              setSelectedRelayPoint(null);
                            }}
                          >
                            <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={method.id} className="cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-900">{method.title}</p>
                                    {method.description && (
                                      <p className="text-sm text-gray-600">{stripHtmlTags(method.description)}</p>
                                    )}
                                  </div>
                                  <p className="font-bold text-[#b8933d]">
                                    {parseFloat(method.cost) === 0 ? 'Gratuit' : `${parseFloat(method.cost).toFixed(2)} €`}
                                  </p>
                                </div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {selectedShippingMethod &&
               selectedAddressId &&
               (() => {
                 const method = shippingMethods.find(m => m.id === selectedShippingMethod);
                 const isRelayDelivery = method?.title?.toLowerCase().includes('relais') ||
                                        method?.title?.toLowerCase().includes('locker') ||
                                        method?.description?.toLowerCase().includes('relais') ||
                                        method?.description?.toLowerCase().includes('locker');
                 const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

                 return isRelayDelivery && selectedAddress ? (
                   <MondialRelaySelector
                     postalCode={selectedAddress.postal_code}
                     country={selectedAddress.country}
                     onRelaySelected={setSelectedRelayPoint}
                     selectedRelay={selectedRelayPoint}
                   />
                 ) : null;
               })()
              }

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#b8933d]" />
                    Assurance facultative
                  </CardTitle>
                  <CardDescription>
                    Protégez votre commande contre la casse et la perte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedInsurance} onValueChange={setSelectedInsurance}>
                    <div className="space-y-4">
                      {insuranceOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                            selectedInsurance === option.id
                              ? 'border-[#b8933d] bg-[#b8933d]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedInsurance(option.id)}
                        >
                          <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={option.id} className="cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{option.label}</p>
                                  <p className="text-sm text-gray-600">{option.description}</p>
                                </div>
                                <p className="font-bold text-[#b8933d]">
                                  {option.price === 0 ? 'Gratuit' : `+${option.price.toFixed(2)} €`}
                                </p>
                              </div>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {paymentGateways.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-[#b8933d]" />
                      Mode de paiement
                    </CardTitle>
                    <CardDescription>
                      {useDeliveryBatch
                        ? activeBatch
                          ? 'Choisissez votre méthode de paiement pour ces articles supplémentaires'
                          : 'Choisissez votre méthode de paiement pour votre colis ouvert'
                        : 'Choisissez votre méthode de paiement'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <div className="space-y-4">
                        {paymentGateways.map((gateway) => (
                          <div
                            key={gateway.id}
                            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                              selectedPaymentMethod === gateway.id
                                ? 'border-[#b8933d] bg-[#b8933d]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedPaymentMethod(gateway.id)}
                          >
                            <RadioGroupItem value={gateway.id} id={gateway.id} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={gateway.id} className="cursor-pointer">
                                <div>
                                  <p className="font-semibold text-gray-900">{gateway.title}</p>
                                  {gateway.description && (
                                    <p className="text-sm text-gray-600">{stripHtmlTags(gateway.description)}</p>
                                  )}
                                </div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Mon colis ouvert (5 jours)
                  </CardTitle>
                  <CardDescription className="text-blue-800">
                    Économisez sur les frais de livraison en groupant vos achats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeBatch && (
                    <Alert className="bg-green-50 border-green-200">
                      <Info className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Vous avez déjà un colis ouvert. Ces articles seront ajoutés sans frais de livraison supplémentaires !
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="delivery-batch" className="text-base font-semibold text-gray-900 cursor-pointer">
                        Activer mon colis ouvert
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {activeBatch
                          ? 'Ajouter à votre colis existant sans frais supplémentaires'
                          : 'Vous aurez 5 jours pour ajouter d\'autres produits sans payer de nouveaux frais de livraison'
                        }
                      </p>
                    </div>
                    <Switch
                      id="delivery-batch"
                      checked={useDeliveryBatch}
                      onCheckedChange={setUseDeliveryBatch}
                      className="ml-4"
                    />
                  </div>

                  {useDeliveryBatch && (
                    <Alert className="bg-white border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        {activeBatch ? (
                          <>
                            <strong>Colis ouvert actif :</strong> Vos articles seront ajoutés à votre colis en cours.
                            Vous pourrez valider le colis à tout moment depuis votre espace client.
                          </>
                        ) : (
                          <>
                            <strong>Comment ça marche ?</strong> Vos articles seront mis en attente pendant 5 jours.
                            Vous pourrez ajouter d&apos;autres produits sans payer de frais de livraison supplémentaires,
                            puis valider le colis quand vous le souhaitez depuis votre espace client.
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#b8933d]" />
                    Récapitulatif de la commande
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cart.map((item) => {
                      const price = parseFloat(
                        item.price?.replace('€', '').replace(',', '.').replace(/\s/g, '') || '0'
                      );
                      const total = price * item.quantity;

                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                            {item.image?.sourceUrl ? (
                              <Image
                                src={item.image.sourceUrl}
                                alt={item.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {total.toFixed(2)} €
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">Total</h2>
                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total</span>
                      <span className="font-medium">{cartTotal.toFixed(2)} €</span>
                    </div>
                    {selectedCoupon && calculateDiscount() > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Réduction ({selectedCoupon.coupon_types.description})</span>
                        <span className="font-medium text-green-600">-{calculateDiscount().toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frais de port</span>
                      <span className="font-medium">
                        {useDeliveryBatch && activeBatch ? (
                          <span className="text-green-600 font-semibold">Offerts</span>
                        ) : calculateShippingCost() === 0 ? (
                          selectedCoupon?.coupon_types.type === 'free_delivery' ? (
                            <span className="text-green-600 font-semibold">Offerts (coupon)</span>
                          ) : (
                            '0.00 €'
                          )
                        ) : (
                          `${calculateShippingCost().toFixed(2)} €`
                        )}
                      </span>
                    </div>
                    {calculateInsuranceCost() > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Assurance</span>
                        <span className="font-medium">{calculateInsuranceCost().toFixed(2)} €</span>
                      </div>
                    )}
                    {!useDeliveryBatch && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">TVA (20%)</span>
                        <span className="font-medium">{calculateTax().toFixed(2)} €</span>
                      </div>
                    )}
                  </div>

                  <CouponSelector
                    selectedCouponId={selectedCoupon?.id || null}
                    onSelectCoupon={setSelectedCoupon}
                    subtotal={cartTotal}
                  />

                  <Separator />

                  {useDeliveryBatch ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total TTC</span>
                        <span className="text-[#b8933d]">
                          {activeBatch
                            ? (cartTotal + calculateInsuranceCost()).toFixed(2)
                            : (cartTotal + calculateShippingCost() + calculateInsuranceCost()).toFixed(2)
                          } €
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {activeBatch
                          ? 'Pas de frais de livraison supplémentaires'
                          : 'Frais de livraison inclus - Valable 5 jours'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total TTC</span>
                      <span className="text-[#b8933d]">{calculateTotal().toFixed(2)} €</span>
                    </div>
                  )}

                  {cartTotal < MINIMUM_ORDER_AMOUNT && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <Info className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        Le montant minimum de commande est de {MINIMUM_ORDER_AMOUNT.toFixed(2)} € (hors frais de port).
                        Il vous manque {(MINIMUM_ORDER_AMOUNT - cartTotal).toFixed(2)} €.
                      </AlertDescription>
                    </Alert>
                  )}

                  <GDPRConsent
                    type="order"
                    checked={gdprConsent}
                    onCheckedChange={setGdprConsent}
                    error={gdprError}
                  />

                  <Button
                    onClick={proceedToPayment}
                    disabled={
                      processing ||
                      addresses.length === 0 ||
                      !selectedAddressId ||
                      !selectedShippingMethod ||
                      !selectedPaymentMethod ||
                      cartTotal < MINIMUM_ORDER_AMOUNT
                    }
                    className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : useDeliveryBatch ? (
                      activeBatch ? (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Ajouter au colis ouvert
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Créer un colis ouvert
                        </>
                      )
                    ) : (
                      'Valider la commande'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
}
