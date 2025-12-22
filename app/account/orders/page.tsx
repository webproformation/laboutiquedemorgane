"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Loader2, FileText, Download, Gem, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { GuestbookForm } from '@/components/GuestbookForm';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  woocommerce_order_id: number | null;
  invoice_url: string | null;
  order_items: OrderItem[];
  has_guestbook_entry?: boolean;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_slug: string;
  product_image: string;
  price: string;
  quantity: number;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);
  const [showGuestbookDialog, setShowGuestbookDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersData) {
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          const { data: guestbookEntry } = await supabase
            .from('guestbook_entries')
            .select('id')
            .eq('order_id', order.id)
            .maybeSingle();

          return {
            ...order,
            order_items: items || [],
            has_guestbook_entry: !!guestbookEntry,
          };
        })
      );

      setOrders(ordersWithItems);
    }

    setLoading(false);
  };

  const fetchInvoice = async (order: Order) => {
    if (!order.woocommerce_order_id) {
      toast.error('Facture non disponible pour cette commande');
      return;
    }

    setLoadingInvoice(order.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-invoice-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            woocommerceOrderId: order.woocommerce_order_id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la facture');
      }

      const { invoiceUrl } = await response.json();

      if (invoiceUrl) {
        await supabase
          .from('orders')
          .update({ invoice_url: invoiceUrl })
          .eq('id', order.id);

        setOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === order.id ? { ...o, invoice_url: invoiceUrl } : o
          )
        );

        window.open(invoiceUrl, '_blank');
      } else {
        toast.error('Facture non disponible pour le moment');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Une erreur est survenue lors de la récupération de la facture');
    } finally {
      setLoadingInvoice(null);
    }
  };

  const downloadInvoice = (invoiceUrl: string) => {
    window.open(invoiceUrl, '_blank');
  };

  const openGuestbookForm = (order: Order) => {
    setSelectedOrder(order);
    setShowGuestbookDialog(true);
  };

  const handleGuestbookSuccess = async () => {
    setShowGuestbookDialog(false);
    setSelectedOrder(null);
    await loadOrders();
    toast.success('Merci pour votre mot doux ! Il sera publié après validation.');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En préparation',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune commande
            </h3>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore passé de commande
            </p>
            <Link
              href="/en-rayon"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#b8933d] hover:bg-[#a07c2f] text-white rounded-lg transition-colors"
            >
              Découvrir nos produits
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#b8933d] rounded-full">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Mes commandes</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {orders.length} commande{orders.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Commande #{order.order_number}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
                {order.woocommerce_order_id && (order.status === 'processing' || order.status === 'delivered' || order.status === 'shipped') && (
                  <div>
                    {order.invoice_url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(order.invoice_url!)}
                        className="text-[#b8933d] border-[#b8933d] hover:bg-[#b8933d] hover:text-white"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Facture
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchInvoice(order)}
                        disabled={loadingInvoice === order.id}
                        className="text-[#b8933d] border-[#b8933d] hover:bg-[#b8933d] hover:text-white"
                      >
                        {loadingInvoice === order.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-1" />
                            Obtenir facture
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="relative w-20 h-20 bg-white rounded-md overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.product_slug}`}
                      className="font-medium text-gray-900 hover:text-[#b8933d] transition-colors"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Quantité: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-[#b8933d]">{formatPrice(item.price)}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-[#b8933d]">
                  {order.total_amount.toFixed(2)} €
                </span>
              </div>

              {order.status === 'delivered' && (
                <div className="pt-4 border-t">
                  {order.has_guestbook_entry ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-green-600 border-green-600"
                      disabled
                    >
                      <CheckCircle className="h-5 w-5" />
                      Avis publié ✅
                    </Button>
                  ) : (
                    <Button
                      onClick={() => openGuestbookForm(order)}
                      className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    >
                      <Gem className="h-5 w-5" />
                      Signer le Livre d&apos;Or - Gagnez 0,20 € !
                    </Button>
                  )}
                  {!order.has_guestbook_entry && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      ✨ Morgane attend votre mot doux ! Signez le livre d&apos;or et gagnez 0,20 € immédiatement.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedOrder && (
        <Dialog open={showGuestbookDialog} onOpenChange={setShowGuestbookDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gem className="h-6 w-6 text-amber-500" />
                Signer le Livre d&apos;Or
              </DialogTitle>
            </DialogHeader>
            <GuestbookForm
              orderId={selectedOrder.id}
              orderNumber={selectedOrder.order_number}
              onSuccess={handleGuestbookSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
