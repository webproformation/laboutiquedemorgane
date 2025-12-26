"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ProductAttribute {
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

interface WooCommerceAttribute {
  id: number;
  name: string;
  slug: string;
  terms: Array<{ id: number; name: string; slug: string }>;
}

interface ProductAttributesManagerProps {
  attributes: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
}

export default function ProductAttributesManager({ attributes, onChange }: ProductAttributesManagerProps) {
  const [wooAttributes, setWooAttributes] = useState<WooCommerceAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWooAttr, setSelectedWooAttr] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [newTermName, setNewTermName] = useState('');
  const [addingTerm, setAddingTerm] = useState(false);
  const [customAttributeName, setCustomAttributeName] = useState('');
  const [customAttributeOptions, setCustomAttributeOptions] = useState('');

  useEffect(() => {
    loadWooCommerceAttributes();
  }, []);

  const loadWooCommerceAttributes = async () => {
    try {
      const response = await fetch('/api/woocommerce/attributes');
      if (response.ok) {
        const data = await response.json();
        console.log('WooCommerce attributes loaded:', data);

        if (data.message) {
          console.warn('WooCommerce message:', data.message);
        }

        const attrs = data.attributes || [];
        setWooAttributes(attrs);

        if (attrs.length === 0) {
          toast.info('Aucun attribut WooCommerce trouvé. Créez-en dans WooCommerce ou utilisez un attribut personnalisé.');
        }
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error(`Erreur: ${errorData.error || 'Erreur lors du chargement des attributs'}`);
      }
    } catch (error) {
      console.error('Error loading WooCommerce attributes:', error);
      toast.error('Erreur lors du chargement des attributs');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWooAttribute = () => {
    return wooAttributes.find(attr => attr.slug === selectedWooAttr);
  };

  const handleAddWooAttribute = () => {
    if (!selectedWooAttr || selectedOptions.length === 0) {
      toast.error('Veuillez sélectionner un attribut et au moins une option');
      return;
    }

    const wooAttr = getCurrentWooAttribute();
    if (!wooAttr) return;

    const existingAttrIndex = attributes.findIndex(
      attr => attr.name.toLowerCase() === wooAttr.name.toLowerCase()
    );

    if (existingAttrIndex >= 0) {
      const updatedAttributes = [...attributes];
      const existingOptions = updatedAttributes[existingAttrIndex].options;
      const newOptions = Array.from(new Set([...existingOptions, ...selectedOptions]));
      updatedAttributes[existingAttrIndex] = {
        ...updatedAttributes[existingAttrIndex],
        options: newOptions,
      };
      onChange(updatedAttributes);
    } else {
      const newAttribute: ProductAttribute = {
        name: wooAttr.name,
        options: selectedOptions,
        visible: true,
        variation: false,
      };
      onChange([...attributes, newAttribute]);
    }

    setSelectedWooAttr('');
    setSelectedOptions([]);
    toast.success('Attribut ajouté avec succès');
  };

  const handleAddNewTerm = async () => {
    if (!newTermName.trim() || !selectedWooAttr) return;

    setAddingTerm(true);
    try {
      const wooAttr = getCurrentWooAttribute();
      if (!wooAttr) return;

      const response = await fetch('/api/woocommerce/attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attributeId: wooAttr.id,
          termName: newTermName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du terme');
      }

      const data = await response.json();

      await loadWooCommerceAttributes();

      setSelectedOptions([...selectedOptions, data.term.name]);
      setNewTermName('');
      toast.success(`Terme "${data.term.name}" ajouté à WooCommerce`);
    } catch (error) {
      console.error('Error adding term:', error);
      toast.error('Erreur lors de l\'ajout du terme');
    } finally {
      setAddingTerm(false);
    }
  };

  const handleAddCustomAttribute = () => {
    if (!customAttributeName.trim() || !customAttributeOptions.trim()) {
      toast.error('Veuillez remplir le nom et les options de l\'attribut');
      return;
    }

    const options = customAttributeOptions
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt);

    const newAttribute: ProductAttribute = {
      name: customAttributeName.trim(),
      options,
      visible: true,
      variation: false,
    };

    onChange([...attributes, newAttribute]);
    setCustomAttributeName('');
    setCustomAttributeOptions('');
    toast.success('Attribut personnalisé ajouté');
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    onChange(newAttributes);
  };

  const handleUpdateAttribute = (index: number, field: keyof ProductAttribute, value: any) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    onChange(newAttributes);
  };

  const handleToggleOption = (optionName: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionName)
        ? prev.filter(o => o !== optionName)
        : [...prev, optionName]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {attributes.map((attr, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-3">
                <div>
                  <Label className="font-semibold text-base">{attr.name}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attr.options.map((option, optIndex) => (
                      <Badge key={optIndex} variant="secondary">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={attr.visible}
                      onCheckedChange={(checked) => handleUpdateAttribute(index, 'visible', checked)}
                    />
                    <Label className="text-sm">Visible sur la page produit</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={attr.variation}
                      onCheckedChange={(checked) => handleUpdateAttribute(index, 'variation', checked)}
                    />
                    <Label className="text-sm">Utilisé pour les variations</Label>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAttribute(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg">Ajouter un attribut WooCommerce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="woo-attr-select">Sélectionner un attribut</Label>
            {wooAttributes.length === 0 ? (
              <div className="p-3 border rounded-md bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Aucun attribut WooCommerce disponible. Créez des attributs dans votre administration WooCommerce
                  (Produits → Attributs) ou utilisez un attribut personnalisé ci-dessous.
                </p>
              </div>
            ) : (
              <Select value={selectedWooAttr} onValueChange={(value) => {
                setSelectedWooAttr(value);
                setSelectedOptions([]);
              }}>
                <SelectTrigger id="woo-attr-select">
                  <SelectValue placeholder="Choisir un attribut..." />
                </SelectTrigger>
                <SelectContent>
                  {wooAttributes.map((attr) => (
                    <SelectItem key={attr.id} value={attr.slug}>
                      {attr.name} ({attr.terms.length} options)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedWooAttr && (
            <>
              <div>
                <Label>Options disponibles (cliquez pour sélectionner)</Label>
                <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-md bg-white">
                  {getCurrentWooAttribute()?.terms.map((term) => (
                    <Badge
                      key={term.id}
                      variant={selectedOptions.includes(term.name) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => handleToggleOption(term.name)}
                    >
                      {selectedOptions.includes(term.name) && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {term.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedOptions.length} option(s) sélectionnée(s)
                </p>
              </div>

              <div className="bg-white p-3 rounded-md border">
                <Label className="text-sm font-medium">Ajouter un nouveau terme</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTermName}
                    onChange={(e) => setNewTermName(e.target.value)}
                    placeholder="Ex: Rose poudré"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewTerm}
                    disabled={!newTermName.trim() || addingTerm}
                  >
                    {addingTerm ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Le nouveau terme sera ajouté à WooCommerce et sélectionné automatiquement
                </p>
              </div>

              <Button
                type="button"
                onClick={handleAddWooAttribute}
                disabled={selectedOptions.length === 0}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter cet attribut au produit
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Ou créer un attribut personnalisé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom-attr-name">Nom de l'attribut</Label>
              <Input
                id="custom-attr-name"
                value={customAttributeName}
                onChange={(e) => setCustomAttributeName(e.target.value)}
                placeholder="Ex: Matière, Style..."
              />
            </div>
            <div>
              <Label htmlFor="custom-attr-options">Options (séparées par des virgules)</Label>
              <Input
                id="custom-attr-options"
                value={customAttributeOptions}
                onChange={(e) => setCustomAttributeOptions(e.target.value)}
                placeholder="Ex: Coton, Polyester, Lin"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustomAttribute}
            disabled={!customAttributeName.trim() || !customAttributeOptions.trim()}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter l'attribut personnalisé
          </Button>
          <p className="text-xs text-gray-500">
            Note : Les attributs personnalisés ne seront pas synchronisés avec WooCommerce
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
