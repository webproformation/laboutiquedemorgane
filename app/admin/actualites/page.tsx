'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Edit2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { GET_POSTS } from '@/lib/queries';
import { GetPostsResponse } from '@/types';

export default function ActualitesAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { loading, data } = useQuery<GetPostsResponse>(GET_POSTS);

  const posts = data?.posts?.nodes || [];

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-[#b8933d]" />
            Gestion des actualités
          </h1>
          <p className="text-gray-600 mt-1">
            Gérer les articles du Carnet de Morgane
          </p>
        </div>
        <Link href="/admin/actualites/edit/new">
          <Button className="bg-[#b8933d] hover:bg-[#a07c2f]">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Rechercher des articles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par titre ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 font-mono">
                        {post.slug}
                      </span>
                      {post.categories.nodes.map((cat) => (
                        <span
                          key={cat.id}
                          className="px-2 py-1 bg-[#b8933d]/10 text-[#b8933d] text-xs font-semibold rounded"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {post.excerpt && post.excerpt.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>
                    <div className="text-xs text-gray-500">
                      Publié le {new Date(post.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/actualites/${post.slug}`}>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" />
                        SEO
                      </Button>
                    </Link>
                    <Link href={`/admin/actualites/edit/${post.databaseId}`}>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPosts.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">Aucun article trouvé</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
