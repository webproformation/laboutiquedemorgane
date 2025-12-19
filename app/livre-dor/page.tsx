'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Quote, Heart, CheckCircle2, Facebook, ShoppingBag, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Review {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  comment: string;
  source: 'website' | 'facebook' | 'product' | 'order';
  source_id: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export default function LivreDorPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('all');
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (filterSource === 'all') {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(r => r.source === filterSource));
    }
  }, [filterSource, reviews]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.email?.split('@')[0] || '',
        customer_email: user.email || '',
      }));
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
      setFilteredReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Erreur lors du chargement des avis');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name.trim() || !formData.comment.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        user_id: user?.id || null,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        rating: formData.rating,
        comment: formData.comment,
        source: 'website' as const,
        is_approved: false,
      };

      const { error } = await supabase
        .from('customer_reviews')
        .insert([reviewData]);

      if (error) throw error;

      toast.success('Merci pour votre avis ! Il sera publié après validation.');

      setFormData({
        customer_name: user?.email?.split('@')[0] || '',
        customer_email: user?.email || '',
        rating: 5,
        comment: '',
      });
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Erreur lors de l\'envoi de votre avis');
    } finally {
      setSubmitting(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'product':
        return <ShoppingBag className="w-4 h-4" />;
      case 'order':
        return <Package className="w-4 h-4" />;
      default:
        return <Heart className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'facebook':
        return 'Facebook';
      case 'product':
        return 'Produit';
      case 'order':
        return 'Commande';
      default:
        return 'Site web';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-[#C6A15B] to-[#b8933d] p-4 rounded-2xl">
              <Quote className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#C6A15B] to-[#b8933d] bg-clip-text text-transparent">
            Livre d'Or
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez ce que nos clientes pensent de La Boutique de Morgane
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-12">
          <Card className="shadow-xl border-2 border-[#C6A15B]/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 bg-gradient-to-r from-[#C6A15B] to-[#b8933d] h-1 rounded"></div>
                <h2 className="text-2xl font-bold text-gray-900">Laissez votre avis</h2>
                <div className="flex-1 bg-gradient-to-r from-[#b8933d] to-[#C6A15B] h-1 rounded"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Votre nom *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Prénom N."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">Votre email (optionnel)</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>

                <div>
                  <Label>Votre note *</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= formData.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="comment">Votre avis *</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Partagez votre expérience avec La Boutique de Morgane..."
                    rows={4}
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    Votre avis sera publié après validation par notre équipe. Merci pour votre confiance !
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#C6A15B] to-[#b8933d] hover:opacity-90 text-white py-6 text-lg font-semibold"
                >
                  {submitting ? 'Envoi en cours...' : 'Publier mon avis'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">
              Tous les avis ({filteredReviews.length})
            </h2>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les avis</SelectItem>
                <SelectItem value="website">Site web</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="product">Produits</SelectItem>
                <SelectItem value="order">Commandes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Chargement des avis...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Quote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-lg">Aucun avis pour le moment</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredReviews.map((review) => (
              <Card
                key={review.id}
                className={`relative hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                  review.is_featured ? 'border-2 border-[#C6A15B]' : ''
                }`}
              >
                <CardContent className="pt-6">
                  {review.is_featured && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-gradient-to-r from-[#C6A15B] to-[#b8933d] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Coup de coeur
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      {getSourceIcon(review.source)}
                      {getSourceLabel(review.source)}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed italic">
                      "{review.comment}"
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900">{review.customer_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C6A15B] to-[#b8933d] flex items-center justify-center text-white font-bold text-lg">
                        {review.customer_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <a
            href="https://www.facebook.com/profile.php?id=100057420760713&sk=reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Facebook className="w-5 h-5" />
            Voir plus d'avis sur Facebook
          </a>
        </div>
      </div>
    </div>
  );
}
