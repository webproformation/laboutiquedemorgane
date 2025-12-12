'use client';

import { Suspense } from 'react';
import { useQuery } from '@apollo/client/react';
import { useSearchParams } from 'next/navigation';
import { GET_POSTS, GET_POSTS_BY_CATEGORY } from '@/lib/queries';
import { GetPostsResponse } from '@/types';
import NewsCard from '@/components/NewsCard';
import { Newspaper } from 'lucide-react';

function ActualitesContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');

  const { loading, data } = useQuery<GetPostsResponse>(
    categorySlug ? GET_POSTS_BY_CATEGORY : GET_POSTS,
    {
      variables: categorySlug ? { categorySlug } : undefined,
    }
  );

  const posts = data?.posts?.nodes || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Newspaper className="h-8 w-8 text-[#b8933d]" />
            <h1 className="text-4xl font-bold text-gray-900">Actualités</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getCategoryName = () => {
    if (categorySlug && posts.length > 0) {
      const firstPost = posts[0];
      const category = firstPost.categories.nodes.find(cat => cat.slug === categorySlug);
      return category?.name;
    }
    return null;
  };

  const categoryName = getCategoryName();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Newspaper className="h-8 w-8 text-[#b8933d]" />
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {categoryName ? `Actualités - ${categoryName}` : 'Actualités'}
            </h1>
            {categoryName && (
              <p className="text-gray-600 mt-2">
                {posts.length} article{posts.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              Aucune actualité pour le moment
            </h2>
            <p className="text-gray-500">
              Revenez bientôt pour découvrir nos dernières nouvelles
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActualitesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Newspaper className="h-8 w-8 text-[#b8933d]" />
              <h1 className="text-4xl font-bold text-gray-900">Actualités</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ActualitesContent />
    </Suspense>
  );
}
