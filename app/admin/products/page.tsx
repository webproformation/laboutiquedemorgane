"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Loader2, Upload, Filter, Eye, EyeOff, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  status: string;
  stock_status: string;
  stock_quantity: number | null;
  images?: Array<{
    src: string;
    name?: string;
  }>;
}

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'publish' | 'draft'>('all');
  const perPage = 10;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/woocommerce/products?action=all');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p: WooProduct) =>
        p.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p: WooProduct) => p.status === statusFilter);
    }

    return filtered;
  }, [products, search, statusFilter]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page, perPage]);

  const totalPages = Math.ceil(filteredProducts.length / perPage);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleStatusChange = async (productId: number, action: 'draft' | 'publish') => {
    setStatusUpdating(productId);
    try {
      const response = await fetch('/api/woocommerce/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          productId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur lors de la mise à jour du statut`);
      }

      await loadProducts();
      toast.success(action === 'draft' ? 'Produit mis en brouillon' : 'Produit publié');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
      console.error(error);
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des Produits</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {filteredProducts.length} produits au total
          </div>
          <Link href="/admin/products/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un produit
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="publish">Actifs</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : paginatedProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">
              {search ? 'Aucun produit trouvé pour cette recherche' : 'Aucun produit disponible'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="w-32">Prix</TableHead>
                  <TableHead className="w-32">Stock</TableHead>
                  <TableHead className="w-32">Statut Produit</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => {
                  const isDraft = product.status === 'draft';

                  return (
                    <TableRow key={product.id} className={isDraft ? 'opacity-50' : ''}>
                      <TableCell>
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </TableCell>
                      <TableCell>
                        {product.images && product.images.length > 0 && product.images[0]?.src ? (
                          <img
                            src={product.images[0].src}
                            alt={product.name}
                            className={`w-12 h-12 object-cover rounded ${isDraft ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400">N/A</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${isDraft ? 'text-gray-400' : ''}`}>
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">{product.slug}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.price}€</div>
                        {product.regular_price && product.price !== product.regular_price && (
                          <div className="text-sm text-gray-400 line-through">
                            {product.regular_price}€
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          product.stock_status === 'instock'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {product.stock_status === 'instock' ? 'En stock' : 'Rupture'}
                          {product.stock_quantity && product.stock_quantity > 0 && ` (${product.stock_quantity})`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isDraft ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              Brouillon
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(product.id, 'publish')}
                              disabled={statusUpdating === product.id}
                              title="Publier ce produit"
                            >
                              {statusUpdating === product.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                              Publié
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(product.id, 'draft')}
                              disabled={statusUpdating === product.id}
                              title="Mettre en brouillon"
                            >
                              {statusUpdating === product.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
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
          )}
        </>
      )}
    </div>
  );
}
