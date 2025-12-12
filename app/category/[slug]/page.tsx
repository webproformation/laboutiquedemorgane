'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCTS_BY_CATEGORY, GET_PRODUCTS_BY_CATEGORIES, GET_PRODUCT_CATEGORIES } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Product, GetProductsByCategoryResponse, GetProductCategoriesResponse } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { parsePrice } from '@/lib/utils';

export default function CategoryPage() {
  const params = useParams();
  const rawSlug = params.slug as string;
  const slug = decodeURIComponent(rawSlug);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number } | undefined>();

  const { data: categoriesData } = useQuery<GetProductCategoriesResponse>(GET_PRODUCT_CATEGORIES);

  const currentCategory = categoriesData?.productCategories?.nodes.find(
    cat => cat.slug === slug
  );

  const subCategories = currentCategory
    ? categoriesData?.productCategories?.nodes.filter(cat => cat.parentId === currentCategory.id) || []
    : [];

  const allCategorySlugs = currentCategory
    ? [slug, ...subCategories.map(cat => cat.slug)]
    : [slug];

  const { loading: loadingProducts, error: errorProducts, data: dataProducts, refetch } =
    useQuery<GetProductsByCategoryResponse>(
      subCategories.length > 0 ? GET_PRODUCTS_BY_CATEGORIES : GET_PRODUCTS_BY_CATEGORY,
      {
        variables: subCategories.length > 0
          ? { categorySlugs: allCategorySlugs }
          : { categorySlug: slug },
      }
    );

  const handleRefresh = async () => {
    await refetch();
  };

  if (errorProducts) {
    console.error('GraphQL Error:', errorProducts);
  }

  // Always call hooks before any conditional returns
  const products: Product[] = dataProducts?.products?.nodes || [];

  const handleFilterChange = useCallback((newFilters: Record<string, string[]>, newPriceRange?: { min: number; max: number }) => {
    setFilters(newFilters);
    setPriceFilter(newPriceRange);
  }, []);

  const filteredProducts = useMemo(() => {
    const hasAttributeFilters = Object.keys(filters).length > 0;
    const hasPriceFilter = priceFilter !== undefined;

    let result = [...products];

    if (hasAttributeFilters || hasPriceFilter) {
      result = result.filter((product) => {
        if (hasPriceFilter) {
          const productPrice = parsePrice(product.price);
          if (productPrice < priceFilter.min || productPrice > priceFilter.max) {
            return false;
          }
        }

        if (hasAttributeFilters) {
          const attributes = product.attributes?.nodes;
          if (!attributes || attributes.length === 0) {
            return false;
          }

          const matchesAllFilters = Object.entries(filters).every(([attributeSlug, selectedTermNames]) => {
            const productAttribute = attributes.find(
              (attr) => {
                const attrSlug = attr.slug || attr.name.toLowerCase().replace(/\s+/g, '-');
                const normalizedAttrSlug = attrSlug.replace('pa_', '');
                const normalizedFilterSlug = attributeSlug.replace('pa_', '');

                return normalizedAttrSlug === normalizedFilterSlug ||
                       attrSlug === attributeSlug ||
                       attr.name.toLowerCase() === attributeSlug.replace(/-/g, ' ').toLowerCase();
              }
            );

            if (!productAttribute || !productAttribute.options) {
              return false;
            }

            const hasMatch = selectedTermNames.some((termName) => {
              return productAttribute.options.some((option) =>
                option.toLowerCase().trim() === termName.toLowerCase().trim()
              );
            });

            return hasMatch;
          });

          return matchesAllFilters;
        }

        return true;
      });
    }

    result.sort((a, b) => {
      const priceA = parsePrice(a.price);
      const priceB = parsePrice(b.price);
      return priceA - priceB;
    });

    return result;
  }, [products, filters, priceFilter]);

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (errorProducts) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux catégories
            </Button>
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger les produits de cette catégorie.
              <br />
              <span className="text-xs">Détails: {errorProducts.message}</span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux catégories
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loadingProducts}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingProducts ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {currentCategory?.name || 'Catégorie'}
          </h1>
          {currentCategory?.description && (
            <p className="text-lg text-gray-600 mb-4">{currentCategory.description}</p>
          )}
          <p className="text-gray-500">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
            {Object.keys(filters).length > 0 && ` (sur ${products.length} total)`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <ProductFilters
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              products={products}
            />
          </aside>

          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Aucun produit</AlertTitle>
                <AlertDescription>
                  {Object.keys(filters).length > 0
                    ? "Aucun produit ne correspond aux filtres sélectionnés."
                    : "Il n'y a actuellement aucun produit dans cette catégorie."}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={`${product.id}-${product.slug}`} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
