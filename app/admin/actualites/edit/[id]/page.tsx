'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, Save, Loader2, Image } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';
import SeoMetadataEditor from '@/components/SeoMetadataEditor';
import WordPressMediaSelector from '@/components/WordPressMediaSelector';

interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  status: 'publish' | 'draft' | 'pending';
  slug: string;
  featured_media?: number;
  featured_image_url?: string;
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
  });

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
      });
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Le titre est obligatoire');
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
    <div className="max-w-5xl mx-auto space-y-6">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Extrait</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Court résumé de l'article"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Image mise en avant</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="publish">Publié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenu</Label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="Contenu de l'article..."
            />
          </div>
        </CardContent>
      </Card>

      <SeoMetadataEditor
        entityType="post"
        entityIdentifier={formData.slug || `new-post-${Date.now()}`}
        autoSave={false}
      />

      <div className="flex justify-between">
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
