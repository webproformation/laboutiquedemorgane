'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { parsePrice } from '@/lib/utils';

interface AttributeTerm {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface Attribute {
  id: number;
  name: string;
  slug: string;
  terms: AttributeTerm[];
}

interface ProductAttribute {
  __typename?: string;
  name: string;
  slug?: string;
  options?: string[];
}

interface ProductAttributesConnection {
  __typename?: string;
  nodes?: ProductAttribute[];
}

interface ProductFiltersProps {
  onFilterChange: (filters: Record<string, string[]>, priceRange?: { min: number; max: number }) => void;
  initialFilters?: Record<string, string[]>;
  products?: Array<{
    price: string;
    attributes?: ProductAttributesConnection;
  }>;
}

export default function ProductFilters({ onFilterChange, initialFilters = {}, products = [] }: ProductFiltersProps) {
  const { user } = useAuth();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(initialFilters);
  const isFirstRender = useRef(true);

  const prices = products
    .map(p => parsePrice(p.price))
    .filter(p => p > 0);

  const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
  const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000;

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(maxPrice);

  useEffect(() => {
    const extractAttributes = () => {
      try {
        if (!products || products.length === 0) {
          setAttributes([]);
          setLoading(false);
          return;
        }

        const attributesMap = new Map<string, { id: number; name: string; slug: string; terms: Map<string, { id: number; name: string; slug: string; count: number }> }>();

        products.forEach((product) => {
          const productAttributes = product.attributes?.nodes || [];

          productAttributes.forEach((attr: any) => {
            const attrSlug = attr.slug || attr.name.toLowerCase().replace(/\s+/g, '-');
            const attrName = attr.name.replace('pa_', '').replace(/-/g, ' ')
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            if (!attributesMap.has(attrSlug)) {
              attributesMap.set(attrSlug, {
                id: Math.abs(attrSlug.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)),
                name: attrName,
                slug: attrSlug,
                terms: new Map()
              });
            }

            const attribute = attributesMap.get(attrSlug)!;

            if (attr.options && Array.isArray(attr.options)) {
              attr.options.forEach((option: string) => {
                const termSlug = option.toLowerCase().trim();
                const termName = option.trim();

                if (!attribute.terms.has(termSlug)) {
                  attribute.terms.set(termSlug, {
                    id: Math.abs(termSlug.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)),
                    name: termName,
                    slug: termSlug,
                    count: 0
                  });
                }

                const term = attribute.terms.get(termSlug)!;
                term.count++;
              });
            }
          });
        });

        const extractedAttributes = Array.from(attributesMap.values()).map(attr => ({
          ...attr,
          terms: Array.from(attr.terms.values())
        })).filter(attr => attr.terms.length > 0);

        setAttributes(extractedAttributes);
      } catch (error) {
        console.error('Error extracting attributes:', error);
        setAttributes([]);
      } finally {
        setLoading(false);
      }
    };

    extractAttributes();
  }, [products]);

  useEffect(() => {
    if (prices.length > 0) {
      setPriceRange([minPrice, maxPrice]);
      setMaxPriceFilter(maxPrice);
    }
  }, [minPrice, maxPrice, prices.length]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onFilterChange(selectedFilters, { min: minPrice, max: maxPriceFilter });
  }, [selectedFilters, maxPriceFilter, minPrice, onFilterChange]);

  const handleFilterChange = (attributeSlug: string, termName: string, checked: boolean) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev };

      if (checked) {
        if (!newFilters[attributeSlug]) {
          newFilters[attributeSlug] = [];
        }
        newFilters[attributeSlug] = [...newFilters[attributeSlug], termName];
      } else {
        if (newFilters[attributeSlug]) {
          newFilters[attributeSlug] = newFilters[attributeSlug].filter((name) => name !== termName);
          if (newFilters[attributeSlug].length === 0) {
            delete newFilters[attributeSlug];
          }
        }
      }

      return newFilters;
    });
  };

  const handleMaxPriceChange = (value: number[]) => {
    setMaxPriceFilter(value[0]);
  };

  const applyPriceFilter = () => {
    // The useEffect will handle calling onFilterChange
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    setMaxPriceFilter(maxPrice);
  };

  const hasActiveFilters = Object.keys(selectedFilters).length > 0 ||
    maxPriceFilter !== maxPrice;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtres</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer tout
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {prices.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Prix maximum</h3>
            <div className="space-y-4">
              <Slider
                min={minPrice}
                max={maxPrice}
                step={1}
                value={[maxPriceFilter]}
                onValueChange={handleMaxPriceChange}
                onValueCommit={applyPriceFilter}
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={minPrice}
                    disabled
                    className="h-8 text-sm bg-muted"
                  />
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={maxPriceFilter}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || maxPrice;
                      setMaxPriceFilter(Math.max(minPrice, Math.min(value, maxPrice)));
                    }}
                    onBlur={applyPriceFilter}
                    min={minPrice}
                    max={maxPrice}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{minPrice}€</span>
                <span>{maxPrice}€</span>
              </div>
            </div>
          </div>
        )}

        {attributes.length > 0 && attributes.map((attribute) => {
          if (!attribute.terms || attribute.terms.length === 0) {
            return null;
          }

          const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
          const isSizeAttribute = attribute.slug.toLowerCase().includes('taille') ||
                                 attribute.slug.toLowerCase().includes('size') ||
                                 attribute.name.toLowerCase().includes('taille') ||
                                 attribute.name.toLowerCase().includes('size');

          const sortedTerms = isSizeAttribute
            ? [...attribute.terms].sort((a, b) => {
                const aUpper = a.name.toUpperCase();
                const bUpper = b.name.toUpperCase();
                const aIndex = sizeOrder.indexOf(aUpper);
                const bIndex = sizeOrder.indexOf(bUpper);

                if (aIndex !== -1 && bIndex !== -1) {
                  return aIndex - bIndex;
                }
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.name.localeCompare(b.name);
              })
            : attribute.terms;

          return (
            <div key={attribute.id} className="space-y-3">
              <h3 className="font-semibold text-sm capitalize">{attribute.name}</h3>
              <div className="space-y-2">
                {sortedTerms.map((term) => (
                  <div key={term.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${attribute.slug}-${term.slug}`}
                      checked={selectedFilters[attribute.slug]?.includes(term.name) || false}
                      onCheckedChange={(checked) =>
                        handleFilterChange(attribute.slug, term.name, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`${attribute.slug}-${term.slug}`}
                      className="text-sm font-normal cursor-pointer flex-1 capitalize"
                    >
                      {term.name}
                      {term.count > 0 && (
                        <span className="text-muted-foreground ml-1">({term.count})</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {attributes.length === 0 && prices.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun filtre disponible pour cette catégorie.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
