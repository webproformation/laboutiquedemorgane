'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, Save, Loader2, Image, Tag } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';
import SeoMetadataEditor from '@/components/SeoMetadataEditor';
import WordPressMediaSelector from '@/components/WordPressMediaSelector';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@apollo/client/react';
import { GET_POST_CATEGORIES } from '@/lib/queries';
import { GetPostCategoriesResponse } from '@/types';

interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  status: 'publish' | 'draft' | 'pending';
  slug: string;
  featured_media?: number;
  featured_image_url?: string;
  categories?: number[];
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNewPost = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNewPost);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    slug: '',
    featured_media: 0,
    featured_image_url: '',
    categories: [],
  });

  const { data: categoriesData, loading: categoriesLoading } = useQuery<GetPostCategoriesResponse>(GET_POST_CATEGORIES);
  const availableCategories = categoriesData?.categories?.nodes || [];

  useEffect(() => {
    if (!isNewPost) {
      fetchPost();
    }
  }, [id, isNewPost]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching post with ID:', id);
      const response = await fetch(`/api/wordpress/posts?id=${id}`);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('Error response:', errorData);

        let errorMessage = errorData.error || 'Failed to fetch post';
        if (errorData.details?.message) {
          errorMessage += `: ${errorData.details.message}`;
        }
        if (errorData.url) {
          console.log('Attempted URL:', errorData.url);
        }

        throw new Error(errorMessage);
      }

      const post = await response.json();
      console.log('Post fetched successfully:', post);
      setFormData({
        title: post.title?.rendered || '',
        content: post.content?.rendered || '',
        excerpt: post.excerpt?.rendered || '',
        status: post.status || 'draft',
        slug: post.slug || '',
        featured_media: post.featured_media || 0,
        featured_image_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
        categories: post.categories || [],
      });
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    const currentCategories = formData.categories || [];
    const isSelected = currentCategories.includes(categoryId);

    setFormData({
      ...formData,
      categories: isSelected
        ? currentCategories.filter(id => id !== categoryId)
        : [...currentCategories, categoryId],
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }

    if (!formData.categories || formData.categories.length === 0) {
      toast.error('Veuillez sélectionner au moins une catégorie');
      return;
    }

    try {
      setIsSaving(true);

      const postData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        status: formData.status,
        featured_media: formData.featured_media || 0,
        categories: formData.categories,
      };

      let response;
      if (isNewPost) {
        response = await fetch('/api/wordpress/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
      } else {
        response = await fetch(`/api/wordpress/posts?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save post');
      }

      const savedPost = await response.json();
      toast.success(isNewPost ? 'Article créé avec succès !' : 'Article mis à jour avec succès !');

      if (isNewPost) {
        setFormData({
          title: savedPost.title?.rendered || formData.title,
          content: savedPost.content?.rendered || formData.content,
          excerpt: savedPost.excerpt?.rendered || formData.excerpt,
          status: savedPost.status || formData.status,
          slug: savedPost.slug || '',
          featured_media: savedPost.featured_media || formData.featured_media || 0,
          featured_image_url: savedPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || formData.featured_image_url || '',
          categories: savedPost.categories || formData.categories || [],
        });

        router.replace(`/admin/actualites/edit/${savedPost.id}`);
      } else {
        setFormData({
          ...formData,
          title: savedPost.title?.rendered || formData.title,
          content: savedPost.content?.rendered || formData.content,
          excerpt: savedPost.excerpt?.rendered || formData.excerpt,
          status: savedPost.status || formData.status,
          slug: savedPost.slug || formData.slug,
          featured_media: savedPost.featured_media || formData.featured_media || 0,
          featured_image_url: savedPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || formData.featured_image_url || '',
          categories: savedPost.categories || formData.categories || [],
        });
      }
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/admin/actualites">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux actualités
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-[#b8933d]" />
          {isNewPost ? 'Nouvel article' : 'Modifier l\'article'}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'article</CardTitle>
              <CardDescription>
                Remplissez les détails de votre article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de l'article"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Extrait</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Court résumé de l'article (affiché dans les listes d'articles)"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Recommandé: 150-200 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label>Contenu de l'article</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Rédigez le contenu de votre article ici..."
                />
              </div>
            </CardContent>
          </Card>

          <SeoMetadataEditor
            entityType="post"
            entityIdentifier={formData.slug || `new-post-${Date.now()}`}
            autoSave={false}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paramètres de publication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'publish' | 'draft' | 'pending') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        Brouillon
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        En attente
                      </div>
                    </SelectItem>
                    <SelectItem value="publish">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        Publié
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isNewPost && formData.slug && (
                <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-gray-600">URL</Label>
                  <p className="text-xs font-mono text-gray-900 break-all">
                    /actualites/{formData.slug}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#b8933d]" />
                <CardTitle className="text-lg">Catégories *</CardTitle>
              </div>
              <CardDescription>
                Sélectionnez au moins une catégorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-[#b8933d]" />
                </div>
              ) : availableCategories.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  <p className="mb-3">Aucune catégorie disponible</p>
                  <Link href="/admin/actualites/categories">
                    <Button size="sm" variant="outline">
                      Créer une catégorie
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableCategories.map((category: any) => (
                    <div key={category.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.categories?.includes(parseInt(category.databaseId || category.id))}
                        onCheckedChange={() => handleCategoryToggle(parseInt(category.databaseId || category.id))}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {category.name}
                        </label>
                        {category.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {formData.categories && formData.categories.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-600 mb-2">Catégories sélectionnées:</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.categories.map((catId) => {
                          const cat = availableCategories.find((c: any) =>
                            parseInt(c.databaseId || c.id) === catId
                          );
                          return cat ? (
                            <Badge
                              key={catId}
                              variant="secondary"
                              className="bg-[#b8933d]/10 text-[#b8933d] text-xs"
                            >
                              {cat.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-[#b8933d]" />
                <CardTitle className="text-lg">Image mise en avant</CardTitle>
              </div>
              <CardDescription>
                Image principale de l'article
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WordPressMediaSelector
                selectedImage={formData.featured_image_url}
                onSelect={(url, id) =>
                  setFormData({
                    ...formData,
                    featured_image_url: url,
                    featured_media: id
                  })
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between sticky bottom-0 bg-white border-t p-4 -mx-4">
        <Link href="/admin/actualites">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        </Link>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#b8933d] hover:bg-[#a07c2f]"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isNewPost ? 'Créer l\'article' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
