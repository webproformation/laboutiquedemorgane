"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
  };
  line_items: Array<{ name: string; quantity: number }>;
}

const statusLabels: Record<string, string> = {
  'pending': 'En attente',
  'processing': 'En traitement',
  'on-hold': 'En attente',
  'completed': 'Terminée',
  'cancelled': 'Annulée',
  'refunded': 'Remboursée',
  'failed': 'Échouée',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/woocommerce/orders?action=list&page=${page}&per_page=10${filterStatus !== 'all' ? `&status=${filterStatus}` : ''}`;

      const response = await fetch(url);

      const data = await response.json();
      setOrders(data.orders || []);
      setTotalPages(parseInt(data.totalPages || '1'));
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, filterStatus]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await fetch('/api/woocommerce/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          orderData: { status: newStatus }
        }),
      });

      toast.success('Statut mis à jour');
      fetchOrders();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Gestion des Commandes</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">
                        Commande #{order.number}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {order.billing.first_name} {order.billing.last_name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(order.date_created).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-4 sm:gap-2 items-center sm:items-end">
                      <p className="font-bold text-lg">{order.total}€</p>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Package className="w-4 h-4" />
                      <span>Articles:</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {order.line_items.map((item, idx) => (
                        <li key={idx} className="text-gray-600">
                          {item.name} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <span className="px-4 py-2">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
