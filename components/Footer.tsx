'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_CATEGORIES } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Send,
  ArrowUp,
  Cookie
} from 'lucide-react';
import GDPRConsent from '@/components/GDPRConsent';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface GetCategoriesResponse {
  productCategories: {
    nodes: Category[];
  };
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState('');
  const { data } = useQuery<GetCategoriesResponse>(GET_PRODUCT_CATEGORIES);

  const categories = data?.productCategories?.nodes?.slice(0, 6) || [];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    if (!gdprConsent) {
      setGdprError('Vous devez accepter la politique de confidentialité');
      toast.error('Veuillez accepter la politique de confidentialité');
      return;
    }

    setGdprError('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Cette adresse email est déjà inscrite');
        } else {
          toast.error('Erreur lors de l\'inscription');
        }
      } else {
        toast.success('Merci pour votre inscription !');
        setEmail('');
        setGdprConsent(false);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="py-8" style={{ backgroundColor: '#C6A15B' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/retours-gratuits"
              className="flex flex-col items-center text-center gap-3 hover:scale-110 transition-all duration-300 animate-in fade-in"
              style={{ animationDelay: '100ms', animationDuration: '600ms' }}
            >
              <img
                src="https://laboutiquedemorgane.webprocreation.fr/wp-content/uploads/2025/12/01.jpg"
                alt="Retours gratuits"
                className="w-16 h-16 object-contain transition-transform duration-300"
              />
              <div className="text-white">
                <p className="font-semibold text-lg">Retours gratuits</p>
                <p className="text-base">sous 14 jours</p>
              </div>
            </Link>

            <Link
              href="/frais-de-port"
              className="flex flex-col items-center text-center gap-3 hover:scale-110 transition-all duration-300 animate-in fade-in"
              style={{ animationDelay: '200ms', animationDuration: '600ms' }}
            >
              <img
                src="https://laboutiquedemorgane.webprocreation.fr/wp-content/uploads/2025/12/02.jpg"
                alt="Frais de port offerts"
                className="w-16 h-16 object-contain transition-transform duration-300"
              />
              <div className="text-white">
                <p className="font-semibold text-lg">Frais de port offerts</p>
                <p className="text-base">sous conditions des jeux concours ou coupons</p>
              </div>
            </Link>

            <Link
              href="/satisfait-rembourse"
              className="flex flex-col items-center text-center gap-3 hover:scale-110 transition-all duration-300 animate-in fade-in"
              style={{ animationDelay: '300ms', animationDuration: '600ms' }}
            >
              <img
                src="https://laboutiquedemorgane.webprocreation.fr/wp-content/uploads/2025/12/03.jpg"
                alt="Satisfait(e) remboursé(e)"
                className="w-16 h-16 object-contain transition-transform duration-300"
              />
              <div className="text-white">
                <p className="font-semibold text-lg">Satisfait(e)</p>
                <p className="text-base">remboursé(e)</p>
              </div>
            </Link>

            <Link
              href="/paiements-securises"
              className="flex flex-col items-center text-center gap-3 hover:scale-110 transition-all duration-300 animate-in fade-in"
              style={{ animationDelay: '400ms', animationDuration: '600ms' }}
            >
              <img
                src="https://laboutiquedemorgane.webprocreation.fr/wp-content/uploads/2025/12/04.jpg"
                alt="Paiements sécurisés"
                className="w-16 h-16 object-contain transition-transform duration-300"
              />
              <div className="text-white">
                <p className="font-semibold text-lg">Paiements</p>
                <p className="text-base">sécurisés</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="text-center md:text-left">
            <h3 className="text-white font-bold text-xl md:text-lg mb-4">Contact</h3>
            <div className="space-y-2 text-base md:text-sm">
              <div className="flex items-start gap-2 justify-center md:justify-start">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p>1062 rue d&apos;Armentières</p>
                  <p>59850 Nieppe</p>
                </div>
              </div>
              <div className="flex items-start gap-2 justify-center md:justify-start">
                <Phone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <a href="tel:+33641456671" className="hover:text-white transition-colors block">
                    <strong>Morgane</strong> : +33 6 41 45 66 71
                  </a>
                  <a href="tel:+33603489600" className="hover:text-white transition-colors block">
                    <strong>André</strong> : +33 6 03 48 96
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a href="mailto:contact@laboutiquedemorgane.fr" className="hover:text-white transition-colors">
                  contact@laboutiquedemorgane.fr
                </a>
              </div>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-white font-bold text-xl md:text-lg mb-4">Catégories</h3>
            <ul className="space-y-2 text-base md:text-sm">
              <li>
                <Link href="/category/nouveautes" className="hover:text-white transition-colors">
                  Nouveautés
                </Link>
              </li>
              <li>
                <Link href="/category/mode" className="hover:text-white transition-colors">
                  Mode
                </Link>
              </li>
              <li>
                <Link href="/category/les-looks-de-morgane" className="hover:text-white transition-colors">
                  Les looks de Morgane
                </Link>
              </li>
              <li>
                <Link href="/category/maison" className="hover:text-white transition-colors">
                  Maison
                </Link>
              </li>
              <li>
                <Link href="/category/beaute-senteurs" className="hover:text-white transition-colors">
                  Beauté et Senteurs
                </Link>
              </li>
              <li>
                <Link href="/category/bonnes-affaires" className="hover:text-white transition-colors">
                  Bonnes affaires
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-white font-bold text-xl md:text-lg mb-4">Liens rapides</h3>
            <ul className="space-y-2 text-base md:text-sm">
              <li>
                <Link href="/qui-sommes-nous" className="hover:text-white transition-colors">
                  Qui sommes-nous ?
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contactez-nous
                </Link>
              </li>
              <li>
                <Link href="/live" className="hover:text-white transition-colors">
                  Découvrir le live shopping
                </Link>
              </li>
              <li>
                <Link href="/actualites" className="hover:text-white transition-colors">
                  Actualités
                </Link>
              </li>
              <li>
                <Link href="/carte-cadeau" className="hover:text-white transition-colors">
                  Carte cadeau
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Mon compte
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  Ma liste de souhaits
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Mon panier
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-white font-bold text-xl md:text-lg mb-4">Newsletter</h3>
            <p className="text-base md:text-sm mb-4">
              Inscrivez-vous pour recevoir nos offres exclusives et nos dernières nouveautés
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex gap-2 justify-center md:justify-start">
                <Input
                  type="email"
                  placeholder="Votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSubmitting}
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-left">
                <GDPRConsent
                  type="newsletter"
                  checked={gdprConsent}
                  onCheckedChange={setGdprConsent}
                  error={gdprError}
                />
              </div>
            </form>

            <div className="mt-6">
              <h4 className="text-white font-semibold text-base md:text-sm mb-3">Suivez-nous</h4>
              <div className="flex gap-3 justify-center md:justify-start">
                <a
                  href="https://www.facebook.com/p/La-boutique-de-Morgane-100057420760713/?locale=fr_FR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://www.instagram.com/la.boutique.de.morgane/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.tiktok.com/@laboutiquedemorgane"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors"
                  aria-label="TikTok"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>

              <div className="mt-6 md:hidden flex justify-center gap-4">
                <Button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg text-white transition-all duration-300"
                  style={{ backgroundColor: '#C6A15B' }}
                  aria-label="Retour en haut"
                >
                  <ArrowUp className="w-6 h-6" />
                </Button>
                <Button
                  onClick={() => {
                    const event = new CustomEvent('open-cookie-preferences');
                    window.dispatchEvent(event);
                  }}
                  size="icon"
                  className="h-12 w-12 rounded-full bg-[#C6A15B] hover:bg-[#B7933F] shadow-lg"
                  title="Gérer les préférences de cookies"
                >
                  <Cookie className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} La Boutique de Morgane. Tous droits réservés.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/mentions-legales" className="hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link href="/politique-confidentialite" className="hover:text-white transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="/cgv" className="hover:text-white transition-colors">
                CGV
              </Link>
              <span className="text-gray-600">|</span>
              <a
                href="https://webproformation.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors font-medium"
                style={{ color: '#C6A15B' }}
              >
                Site créé par webproformation
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
