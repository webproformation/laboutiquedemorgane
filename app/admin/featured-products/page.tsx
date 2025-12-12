"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Star, Upload, RefreshCw } from 'lucide-react';

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  status: string;
  featured: boolean;
  images?: Array<{
    src: string;
    name?: string;
  }>;
}

export default function FeaturedProductsPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadWooProducts();
    }
  }, [isAdmin]);

  const loadWooProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/woocommerce/products?action=all');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error loading WooCommerce products:', error);
      toast.error('Erreur lors du chargement des produits WooCommerce');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (productId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/woocommerce/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggleFeatured',
          productId: productId,
          featured: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to toggle featured status');

      toast.success(currentStatus ? 'Produit retiré des vedettes' : 'Produit ajouté aux vedettes');
      await loadWooProducts();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const publishProduct = async (productId: number) => {
    try {
      const response = await fetch('/api/woocommerce/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'publish',
          productId: productId,
        }),
      });

      if (!response.ok) throw new Error('Failed to publish product');

      toast.success('Produit publié avec succès');
      await loadWooProducts();
    } catch (error) {
      console.error('Error publishing product:', error);
      toast.error('Erreur lors de la publication du produit');
    }
  };

  const featuredProducts = products.filter(p => p.featured);
  const nonFeaturedProducts = products.filter(p => !p.featured);

  if (adminLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Produits Mis en Vedette</h1>
          <p className="text-gray-600 mt-2">
            Gérez les produits affichés dans le slider de la page d'accueil
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Cochez l'étoile pour ajouter un produit aux vedettes. Les produits vedettes publiés apparaissent automatiquement sur la page d'accueil.
          </p>
        </div>
        <Button onClick={loadWooProducts} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {featuredProducts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                Produits en Vedette ({featuredProducts.length})
              </h2>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Image</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead className="w-32">Prix</TableHead>
                      <TableHead className="w-32">Statut</TableHead>
                      <TableHead className="w-24">Vedette</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featuredProducts.map((product) => {
                      const isDraft = product.status === 'draft';
                      return (
                        <TableRow key={product.id} className={isDraft ? 'opacity-50' : ''}>
                          <TableCell>
                            {product.images && product.images.length > 0 ? (
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
                            <div className="text-sm text-gray-500">ID: {product.id}</div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{product.price}€</span>
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
                                  onClick={() => publishProduct(product.id)}
                                  title="Publier ce produit"
                                >
                                  <Upload className="w-4 h-4 text-green-600" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                Publié
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFeatured(product.id, product.featured)}
                              className="hover:bg-yellow-50"
                            >
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/products/${product.id}`)}
                            >
                              Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {nonFeaturedProducts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Autres Produits ({nonFeaturedProducts.length})
              </h2>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Image</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead className="w-32">Prix</TableHead>
                      <TableHead className="w-32">Statut</TableHead>
                      <TableHead className="w-24">Vedette</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonFeaturedProducts.map((product) => {
                      const isDraft = product.status === 'draft';
                      return (
                        <TableRow key={product.id} className={isDraft ? 'opacity-50' : ''}>
                          <TableCell>
                            {product.images && product.images.length > 0 ? (
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
                            <div className="text-sm text-gray-500">ID: {product.id}</div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{product.price}€</span>
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
                                  onClick={() => publishProduct(product.id)}
                                  title="Publier ce produit"
                                >
                                  <Upload className="w-4 h-4 text-green-600" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                Publié
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFeatured(product.id, product.featured)}
                              className="hover:bg-yellow-50"
                            >
                              <Star className="w-5 h-5 text-gray-300" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/products/${product.id}`)}
                            >
                              Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {products.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-600 mb-4">Aucun produit trouvé</p>
              <p className="text-sm text-gray-500">
                Créez des produits dans WooCommerce pour commencer
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
