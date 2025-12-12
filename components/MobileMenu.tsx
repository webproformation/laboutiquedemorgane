"use client";

import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_CATEGORIES } from '@/lib/queries';
import { GetProductCategoriesResponse } from '@/types';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface MobileMenuProps {
  onLinkClick: () => void;
}

export default function MobileMenu({ onLinkClick }: MobileMenuProps) {
  const { loading, data } = useQuery<GetProductCategoriesResponse>(GET_PRODUCT_CATEGORIES);

  const categories = data?.productCategories?.nodes || [];

  const getCategoryByName = (name: string) => {
    return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  };

  const getSubCategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  const modeCategory = getCategoryByName('Mode');
  const maisonCategory = getCategoryByName('Maison');
  const beauteCategory = getCategoryByName('Beauté et Senteurs');

  if (loading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <Accordion type="single" collapsible className="w-full">
        <div className="border-b">
          <Link
            href="/category/nouveautes"
            onClick={onLinkClick}
            className="flex items-center justify-between py-4 text-base font-medium text-white hover:text-[#D4AF37] transition-colors"
          >
            <span className="uppercase">Nouveautés</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {modeCategory && (
          <AccordionItem value="mode">
            <AccordionTrigger className="text-base font-medium text-white hover:text-[#D4AF37] uppercase">
              Mode
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-4 pb-2">
                <Link
                  href="/category/mode"
                  onClick={onLinkClick}
                  className="block py-2 text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
                >
                  Voir tout Mode
                </Link>
                {getSubCategories(modeCategory.id).map((subCategory) => (
                  <Link
                    key={subCategory.id}
                    href={`/category/${subCategory.slug}`}
                    onClick={onLinkClick}
                    className="block py-2 text-sm text-gray-300 hover:text-[#D4AF37] transition-colors"
                  >
                    {subCategory.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <div className="border-b">
          <Link
            href="/category/les-looks-de-morgane"
            onClick={onLinkClick}
            className="flex items-center justify-between py-4 text-base font-medium text-white hover:text-[#D4AF37] transition-colors"
          >
            <span className="uppercase">Les looks de Morgane</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {maisonCategory && (
          <AccordionItem value="maison">
            <AccordionTrigger className="text-base font-medium text-white hover:text-[#D4AF37] uppercase">
              Maison
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-4 pb-2">
                <Link
                  href="/category/maison"
                  onClick={onLinkClick}
                  className="block py-2 text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
                >
                  Voir tout Maison
                </Link>
                {getSubCategories(maisonCategory.id).map((subCategory) => (
                  <Link
                    key={subCategory.id}
                    href={`/category/${subCategory.slug}`}
                    onClick={onLinkClick}
                    className="block py-2 text-sm text-gray-300 hover:text-[#D4AF37] transition-colors"
                  >
                    {subCategory.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {beauteCategory && (
          <AccordionItem value="beaute">
            <AccordionTrigger className="text-base font-medium text-white hover:text-[#D4AF37] uppercase">
              Beauté et Senteurs
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-4 pb-2">
                <Link
                  href="/category/beaute-et-senteurs"
                  onClick={onLinkClick}
                  className="block py-2 text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
                >
                  Voir tout Beauté et Senteurs
                </Link>
                {getSubCategories(beauteCategory.id).map((subCategory) => (
                  <Link
                    key={subCategory.id}
                    href={`/category/${subCategory.slug}`}
                    onClick={onLinkClick}
                    className="block py-2 text-sm text-gray-300 hover:text-[#D4AF37] transition-colors"
                  >
                    {subCategory.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <div className="border-b">
          <Link
            href="/category/bonnes-affaires"
            onClick={onLinkClick}
            className="flex items-center justify-between py-4 text-base font-medium text-white hover:text-[#D4AF37] transition-colors"
          >
            <span className="uppercase">Bonnes affaires</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </Accordion>

      <div className="mt-6 pt-6 border-t space-y-3">
        <Link
          href="/live"
          onClick={onLinkClick}
          className="block py-2 text-base font-medium text-gray-300 hover:text-[#D4AF37] transition-colors"
        >
          Découvrir le live shopping
        </Link>
        <Link
          href="/carte-cadeau"
          onClick={onLinkClick}
          className="block py-2 text-base font-medium text-gray-300 hover:text-[#D4AF37] transition-colors"
        >
          Carte cadeau
        </Link>
        <Link
          href="/actualites"
          onClick={onLinkClick}
          className="block py-2 text-base font-medium text-gray-300 hover:text-[#D4AF37] transition-colors"
        >
          Actus
        </Link>
      </div>
    </div>
  );
}
