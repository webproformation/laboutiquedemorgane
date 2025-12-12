'use client';

import { Star, Quote } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

const reviews: Review[] = [
  {
    id: '1',
    name: 'Sophie M.',
    rating: 5,
    comment: 'Excellente expérience ! Les produits sont de qualité et la livraison rapide. Je recommande vivement La Boutique de Morgane pour son service client impeccable.',
    date: '2025-12-01',
  },
  {
    id: '2',
    name: 'Marie L.',
    rating: 5,
    comment: 'Ravie de ma commande ! Les articles correspondent parfaitement aux photos. Morgane a un vrai talent pour sélectionner des pièces tendance et de qualité.',
    date: '2025-11-28',
  },
  {
    id: '3',
    name: 'Claire D.',
    rating: 5,
    comment: 'Super boutique ! J\'adore les lives shopping, c\'est convivial et on découvre de belles choses. Les prix sont justes et la qualité au rendez-vous.',
    date: '2025-11-25',
  },
  {
    id: '4',
    name: 'Julie P.',
    rating: 5,
    comment: 'Toujours satisfaite de mes achats ! L\'emballage est soigné et les produits arrivent en parfait état. Morgane est très réactive et à l\'écoute.',
    date: '2025-11-20',
  },
  {
    id: '5',
    name: 'Émilie R.',
    rating: 5,
    comment: 'Une vraie pépite cette boutique ! Les produits sont uniques et le service irréprochable. J\'apprécie particulièrement les conseils personnalisés de Morgane.',
    date: '2025-11-15',
  },
  {
    id: '6',
    name: 'Isabelle B.',
    rating: 5,
    comment: 'Excellente découverte ! La sélection est variée et de qualité. Les lives sont un moment convivial où on se sent comme entre amies. Bravo Morgane !',
    date: '2025-11-10',
  },
];

export default function CustomerReviewsSlider() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#C6A15B' }}>
            Elles ont adoré Morgane
          </h2>
          <p className="text-gray-600 text-lg">
            Découvrez ce que nos clientes pensent de nous
          </p>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 6000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full border border-gray-100">
                  <div className="absolute top-6 right-6 opacity-10">
                    <Quote className="w-16 h-16" style={{ color: '#C6A15B' }} />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-current"
                          style={{ color: '#FFD700' }}
                        />
                      ))}
                    </div>

                    <p className="text-gray-700 mb-6 leading-relaxed italic">
                      "{review.comment}"
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{review.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C6A15B] to-[#b8933d] flex items-center justify-center text-white font-bold text-lg">
                        {review.name.charAt(0)}
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>

        <div className="text-center mt-8">
          <a
            href="https://www.facebook.com/profile.php?id=100057420760713&sk=reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Voir plus d'avis sur Facebook
          </a>
        </div>
      </div>
    </section>
  );
}
