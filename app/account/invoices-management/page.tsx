"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface WooOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface MonthlyOrders {
  month: string;
  year: number;
  orders: WooOrder[];
}

export default function InvoicesManagementPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentMonthOrders, setCurrentMonthOrders] = useState<WooOrder[]>([]);
  const [pastMonthsOrders, setPastMonthsOrders] = useState<MonthlyOrders[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [existingInvoices, setExistingInvoices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!adminLoading) {
      if (!isAdmin) {
        router.push('/account');
      } else {
        loadOrders();
      }
    }
  }, [isAdmin, adminLoading, router]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/woocommerce/orders?action=list&per_page=100');
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      const orders: WooOrder[] = data.orders || [];

      const invoicesResponse = await fetch('/api/invoices');
      const invoicesData = await invoicesResponse.json();
      const invoices = invoicesData.invoices || [];

      const invoiceOrderIds = new Set<number>(invoices.map((inv: any) => inv.woocommerce_order_id as number));
      setExistingInvoices(invoiceOrderIds);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const currentMonthOrdersList: WooOrder[] = [];
      const monthlyOrdersMap = new Map<string, WooOrder[]>();

      const preselected = new Set<number>();

      orders.forEach(order => {
        const orderDate = new Date(order.date_created);
        const orderMonth = orderDate.getMonth();
        const orderYear = orderDate.getFullYear();

        if (orderMonth === currentMonth && orderYear === currentYear) {
          currentMonthOrdersList.push(order);
          if (order.status === 'processing' || order.status === 'completed') {
            preselected.add(order.id);
          }
        } else {
          const key = `${orderYear}-${orderMonth}`;
          if (!monthlyOrdersMap.has(key)) {
            monthlyOrdersMap.set(key, []);
          }
          monthlyOrdersMap.get(key)!.push(order);
          if (order.status === 'processing' || order.status === 'completed') {
            preselected.add(order.id);
          }
        }
      });

      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

      const pastMonths: MonthlyOrders[] = Array.from(monthlyOrdersMap.entries())
        .map(([key, orders]) => {
          const [year, month] = key.split('-').map(Number);
          return {
            month: monthNames[month],
            year,
            orders: orders.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
          };
        })
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return monthNames.indexOf(b.month) - monthNames.indexOf(a.month);
        });

      setCurrentMonthOrders(currentMonthOrdersList.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()));
      setPastMonthsOrders(pastMonths);
      setSelectedOrders(preselected);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const generateInvoices = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Veuillez sélectionner au moins une commande');
      return;
    }

    setGenerating(true);
    try {
      const allOrders = [...currentMonthOrders, ...pastMonthsOrders.flatMap(m => m.orders)];
      const ordersToGenerate = allOrders.filter(order =>
        selectedOrders.has(order.id) && !existingInvoices.has(order.id)
      );

      if (ordersToGenerate.length === 0) {
        toast.info('Toutes les commandes sélectionnées ont déjà une facture');
        setGenerating(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const order of ordersToGenerate) {
        try {
          const response = await fetch('/api/invoices/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              orderData: order,
              autoSend: false,
            }),
          });

          if (response.ok) {
            successCount++;
            existingInvoices.add(order.id);
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error generating invoice for order ${order.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} facture(s) générée(s) avec succès`);
      }
      if (errorCount > 0) {
        toast.error(`Erreur lors de la génération de ${errorCount} facture(s)`);
      }

      await loadOrders();
    } catch (error) {
      console.error('Error generating invoices:', error);
      toast.error('Erreur lors de la génération des factures');
    } finally {
      setGenerating(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const OrdersList = ({ orders, title }: { orders: WooOrder[]; title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title} ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                checked={selectedOrders.has(order.id)}
                onCheckedChange={() => toggleOrder(order.id)}
                disabled={existingInvoices.has(order.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Commande #{order.number}</span>
                  {existingInvoices.has(order.id) && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      <Check className="w-3 h-3" />
                      Facture créée
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {order.billing.first_name} {order.billing.last_name} - {order.total}€
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(order.date_created).toLocaleDateString('fr-FR')} -
                  <span className={`ml-1 ${
                    order.status === 'completed' ? 'text-green-600' :
                    order.status === 'processing' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {order.status === 'completed' ? 'Terminée' :
                     order.status === 'processing' ? 'En traitement' :
                     order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/account">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au profil
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-[#b8933d]" />
            Gestion des Factures
          </h1>
          <p className="text-gray-600 mt-2">
            Sélectionnez les commandes pour générer leurs factures
          </p>
        </div>
        <Button
          onClick={generateInvoices}
          disabled={generating || selectedOrders.size === 0}
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Générer {selectedOrders.size} facture{selectedOrders.size > 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>

      {currentMonthOrders.length > 0 && (
        <OrdersList orders={currentMonthOrders} title="Commandes du mois en cours" />
      )}

      {pastMonthsOrders.map((monthData, index) => (
        <OrdersList
          key={`${monthData.year}-${monthData.month}`}
          orders={monthData.orders}
          title={`${monthData.month} ${monthData.year}`}
        />
      ))}

      {currentMonthOrders.length === 0 && pastMonthsOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Aucune commande trouvée</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
