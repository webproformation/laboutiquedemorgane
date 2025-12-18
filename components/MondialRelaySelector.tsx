'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RelayPoint {
  Num: string;
  LgAdr1: string;
  LgAdr2: string;
  LgAdr3: string;
  LgAdr4: string;
  CP: string;
  Ville: string;
  Pays: string;
  Localisation1: string;
  Localisation2: string;
  Latitude: string;
  Longitude: string;
  Horaires_Lundi: string;
  Horaires_Mardi: string;
  Horaires_Mercredi: string;
  Horaires_Jeudi: string;
  Horaires_Vendredi: string;
  Horaires_Samedi: string;
  Horaires_Dimanche: string;
}

interface MondialRelaySelectorProps {
  postalCode: string;
  country?: string;
  onRelaySelected: (relay: RelayPoint) => void;
  selectedRelay?: RelayPoint | null;
}

declare global {
  interface Window {
    jQuery: any;
    $: any;
    MR_ParcelShopPicker?: {
      init: (options: any) => void;
    };
    mondialRelayScriptsLoaded?: boolean;
  }
}

const loadScript = (src: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;

    const timeout = setTimeout(() => {
      script.remove();
      reject(new Error('Script loading timeout'));
    }, 15000);

    script.onload = () => {
      clearTimeout(timeout);
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.head.appendChild(script);
  });
};

const loadStylesheet = (href: string, id: string): void => {
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

export default function MondialRelaySelector({
  postalCode,
  country = 'FR',
  onRelaySelected,
  selectedRelay,
}: MondialRelaySelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const widgetInitializedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!postalCode || postalCode.length < 5) {
      if (mountedRef.current) {
        setError('Veuillez saisir un code postal valide');
        setLoading(false);
      }
      return;
    }

    const loadWidget = async () => {
      try {
        console.log('[MondialRelay] Starting widget load...');

        if (!window.mondialRelayScriptsLoaded) {
          console.log('[MondialRelay] Loading jQuery...');
          await loadScript('https://code.jquery.com/jquery-3.6.0.min.js', 'jquery-script');

          await new Promise(resolve => {
            const checkJQuery = () => {
              if (window.jQuery) {
                console.log('[MondialRelay] jQuery loaded');
                resolve(true);
              } else {
                setTimeout(checkJQuery, 50);
              }
            };
            checkJQuery();
          });

          console.log('[MondialRelay] Loading Mondial Relay plugin...');
          await loadScript(
            'https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js',
            'mondial-relay-widget-script'
          );

          loadStylesheet(
            'https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.css',
            'mondial-relay-widget-css'
          );

          window.mondialRelayScriptsLoaded = true;
          console.log('[MondialRelay] Scripts loaded');
        }

        if (!mountedRef.current) return;

        await new Promise(resolve => setTimeout(resolve, 200));

        if (window.jQuery && widgetContainerRef.current && mountedRef.current && !widgetInitializedRef.current) {
          const $ = window.jQuery;

          if (typeof $.fn.MR_ParcelShopPicker !== 'function') {
            console.error('[MondialRelay] Plugin not available');
            throw new Error('Le plugin Mondial Relay n\'est pas disponible');
          }

          const containerId = `mr-widget-${postalCode}-${country}`;

          if (widgetContainerRef.current) {
            widgetContainerRef.current.id = containerId;
          }

          console.log('[MondialRelay] Initializing widget with ID:', containerId);
          console.log('[MondialRelay] PostalCode:', postalCode, 'Country:', country);

          $(`#${containerId}`).MR_ParcelShopPicker({
            Target: `#${containerId}`,
            Brand: 'CC20T067',
            Country: country,
            PostCode: postalCode,
            ColLivMod: 'REL',
            NbResults: '7',
            ShowResultsOnMap: true,
            DisplayMapInfo: true,
            GoogleMapsKey: 'AIzaSyCaMpoky_a5DGD5Hs1cA9OBLw2pUkqjTRU',
            OnParcelShopSelected: (relay: RelayPoint) => {
              console.log('[MondialRelay] Relay selected:', relay);
              if (mountedRef.current) {
                onRelaySelected(relay);
              }
            },
          });

          widgetInitializedRef.current = true;
          console.log('[MondialRelay] Widget initialized');

          if (mountedRef.current) {
            setLoading(false);
            setError('');
          }
        }
      } catch (err) {
        console.error('[MondialRelay] Error loading widget:', err);
        if (mountedRef.current) {
          setError('Erreur lors du chargement de la carte des points relais. Veuillez réessayer.');
          setLoading(false);
        }
      }
    };

    loadWidget();

    return () => {
      if (window.jQuery && widgetContainerRef.current) {
        try {
          const $ = window.jQuery;
          const containerId = widgetContainerRef.current.id;
          if (containerId) {
            $(`#${containerId}`).empty();
          }
        } catch (e) {
          console.error('Error cleaning up widget:', e);
        }
      }
      widgetInitializedRef.current = false;
    };
  }, [postalCode, country, onRelaySelected]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#b8933d]" />
          Sélectionner un point relais
        </CardTitle>
        <CardDescription>
          Choisissez le point relais Mondial Relay le plus proche de chez vous
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedRelay && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-1">
                <p className="font-semibold">Point relais sélectionné</p>
                <p className="text-sm">{selectedRelay.LgAdr1}</p>
                <p className="text-sm">{selectedRelay.CP} {selectedRelay.Ville}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
            <span className="ml-3 text-gray-600">Chargement de la carte...</span>
          </div>
        ) : (
          <div
            id="mr-widget-container"
            ref={widgetContainerRef}
            className="min-h-[400px] w-full"
          />
        )}
      </CardContent>
    </Card>
  );
}
