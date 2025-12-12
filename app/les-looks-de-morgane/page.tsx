'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCTS_BY_CATEGORY } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product } from '@/types';

interface ProductsData {
  products: {
    nodes: Product[];
  };
}

export default function LesLooksDeMorganePage() {
  const [activeTab, setActiveTab] = useState('ambiance');

  const categories = [
    { id: 'ambiance', name: "L'ambiance de la semaine", slug: 'lambiance-de-la-semaine' },
    { id: 'coups-de-coeur', name: 'Les coups de coeur de Morgane', slug: 'les-coups-de-coeur-de-morgane' },
    { id: 'look', name: 'Le look de la semaine by Morgane', slug: 'le-look-de-la-semaine-by-morgane' },
  ];

  const currentCategory = categories.find(cat => cat.id === activeTab);

  const { loading, data } = useQuery<ProductsData>(GET_PRODUCTS_BY_CATEGORY, {
    variables: {
      categorySlug: currentCategory?.slug,
      first: 50,
    },
    skip: !currentCategory,
  });

  const products = data?.products?.nodes || [];

  return (
    <div className="min-h-screen bg-[#F2F2E8]">
      <div className="relative h-64 md:h-96 bg-gradient-to-r from-[#D4AF37] to-[#b8933d] flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Les Looks de Morgane</h1>
          <p className="text-lg md:text-xl">Découvrez mes sélections exclusives</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-2 mb-8 bg-white p-2 rounded-lg shadow-lg h-auto">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="text-sm md:text-base py-3 px-4 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-[#D4AF37] mb-4">{category.name}</h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="h-80 w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-600 text-lg">
                    Aucun produit dans cette catégorie pour le moment.
                  </p>
                  <p className="text-gray-500 mt-2">
                    Revenez bientôt pour découvrir les nouvelles sélections de Morgane !
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
