"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface GameSettings {
  id: string;
  is_enabled: boolean;
  popup_delay_seconds: number;
  win_probability: number;
  max_plays_per_user: number;
  max_plays_per_day: number;
  updated_at: string;
}

export default function ScratchGameSettingsPage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const [popupDelay, setPopupDelay] = useState(30);
  const [winProbability, setWinProbability] = useState(30);
  const [maxPlays, setMaxPlays] = useState(1);
  const [maxPlaysPerDay, setMaxPlaysPerDay] = useState(0);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scratch_game_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setIsEnabled(data.is_enabled);
        setPopupDelay(data.popup_delay_seconds);
        setWinProbability(data.win_probability);
        setMaxPlays(data.max_plays_per_user);
        setMaxPlaysPerDay(data.max_plays_per_day || 0);
      } else {
        const { data: newSettings, error: createError } = await supabase
          .from('scratch_game_settings')
          .insert({
            is_enabled: false,
            popup_delay_seconds: 30,
            win_probability: 30,
            max_plays_per_user: 1,
            max_plays_per_day: 1,
          })
          .select()
          .single();

        if (createError) throw createError;

        setSettings(newSettings);
        setIsEnabled(newSettings.is_enabled);
        setPopupDelay(newSettings.popup_delay_seconds);
        setWinProbability(newSettings.win_probability);
        setMaxPlays(newSettings.max_plays_per_user);
        setMaxPlaysPerDay(newSettings.max_plays_per_day || 0);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    if (winProbability < 0 || winProbability > 100) {
      toast.error('La probabilité de gain doit être entre 0 et 100');
      return;
    }

    if (popupDelay < 0) {
      toast.error('Le délai doit être positif');
      return;
    }

    if (maxPlays < 0) {
      toast.error('Le nombre maximum de parties doit être positif ou 0 (illimité)');
      return;
    }

    if (maxPlaysPerDay < 0) {
      toast.error('Le nombre maximum de parties par jour doit être positif ou 0 (pas de limite journalière)');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('scratch_game_settings')
        .update({
          is_enabled: isEnabled,
          popup_delay_seconds: popupDelay,
          win_probability: winProbability,
          max_plays_per_user: maxPlays,
          max_plays_per_day: maxPlaysPerDay,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Paramètres enregistrés avec succès');
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Paramètres du Jeu à Gratter</h1>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Activation du jeu</CardTitle>
            <CardDescription>
              Activez ou désactivez l'affichage du popup de jeu sur la page d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                id="game-enabled"
              />
              <Label htmlFor="game-enabled" className="cursor-pointer">
                {isEnabled ? 'Jeu activé' : 'Jeu désactivé'}
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Délai d'affichage</CardTitle>
            <CardDescription>
              Temps en secondes avant l'affichage du popup après l'arrivée sur la page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="popup-delay">Délai (secondes)</Label>
              <Input
                id="popup-delay"
                type="number"
                min="0"
                value={popupDelay}
                onChange={(e) => setPopupDelay(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">
                Délai actuel: {popupDelay} seconde{popupDelay > 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Probabilité de gain</CardTitle>
            <CardDescription>
              Pourcentage de chance qu'un joueur gagne un coupon (0-100%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="win-probability">Probabilité (%)</Label>
              <Input
                id="win-probability"
                type="number"
                min="0"
                max="100"
                value={winProbability}
                onChange={(e) => setWinProbability(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">
                Probabilité actuelle: {winProbability}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nombre maximum de parties (total)</CardTitle>
            <CardDescription>
              Nombre total de fois qu'un utilisateur peut jouer (0 = illimité)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="max-plays">Parties maximum (total)</Label>
              <Input
                id="max-plays"
                type="number"
                min="0"
                value={maxPlays}
                onChange={(e) => setMaxPlays(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">
                {maxPlays === 0
                  ? 'Parties illimitées'
                  : `Maximum: ${maxPlays} partie${maxPlays > 1 ? 's' : ''} au total par utilisateur`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nombre maximum de parties par jour</CardTitle>
            <CardDescription>
              Nombre de fois qu'un utilisateur peut jouer par jour (0 = pas de limite journalière)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="max-plays-per-day">Parties maximum par jour</Label>
              <Input
                id="max-plays-per-day"
                type="number"
                min="0"
                value={maxPlaysPerDay}
                onChange={(e) => setMaxPlaysPerDay(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">
                {maxPlaysPerDay === 0
                  ? 'Pas de limite journalière (utilise la limite totale)'
                  : `Maximum: ${maxPlaysPerDay} partie${maxPlaysPerDay > 1 ? 's' : ''} par jour`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les paramètres
              </>
            )}
          </Button>
        </div>

        {settings && (
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">
                Dernière modification: {new Date(settings.updated_at).toLocaleString('fr-FR')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
