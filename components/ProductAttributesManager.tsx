"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';

interface ProductAttribute {
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

interface ProductAttributesManagerProps {
  attributes: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
}

export default function ProductAttributesManager({ attributes, onChange }: ProductAttributesManagerProps) {
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeOptions, setNewAttributeOptions] = useState('');

  const handleAddAttribute = () => {
    if (!newAttributeName.trim() || !newAttributeOptions.trim()) return;

    const options = newAttributeOptions.split(',').map(opt => opt.trim()).filter(opt => opt);

    const newAttribute: ProductAttribute = {
      name: newAttributeName.trim(),
      options,
      visible: true,
      variation: false,
    };

    onChange([...attributes, newAttribute]);
    setNewAttributeName('');
    setNewAttributeOptions('');
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

  return (
    <div className="space-y-4">
      {attributes.map((attr, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-3">
                <div>
                  <Label className="font-semibold">{attr.name}</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Options: {attr.options.join(', ')}
                  </p>
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

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attr-name">Nom de l'attribut</Label>
                <Input
                  id="attr-name"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  placeholder="Ex: Couleur, Taille..."
                />
              </div>
              <div>
                <Label htmlFor="attr-options">Options (séparées par des virgules)</Label>
                <Input
                  id="attr-options"
                  value={newAttributeOptions}
                  onChange={(e) => setNewAttributeOptions(e.target.value)}
                  placeholder="Ex: Rouge, Bleu, Vert"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddAttribute}
              disabled={!newAttributeName.trim() || !newAttributeOptions.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter l'attribut
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
