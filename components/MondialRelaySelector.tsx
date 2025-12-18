'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, CheckCircle2, Clock, Navigation, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RelayPoint {
  Id: string;
  Name: string;
  Address1: string;
  Address2?: string;
  City: string;
  PostCode: string;
  Country: string;
  Latitude: number;
  Longitude: number;
  Distance?: number;
  OpeningHours?: {
    Monday?: string;
    Tuesday?: string;
    Wednesday?: string;
    Thursday?: string;
    Friday?: string;
    Saturday?: string;
    Sunday?: string;
  };
  LocalizationHints?: string[];
  Num?: string;
  LgAdr1?: string;
  LgAdr2?: string;
  CP?: string;
  Ville?: string;
  Pays?: string;
}

interface MondialRelaySelectorProps {
  postalCode: string;
  country?: string;
  onRelaySelected: (relay: RelayPoint) => void;
  selectedRelay?: RelayPoint | null;
}

const formatOpeningHours = (hours?: string): string => {
  if (!hours) return 'Fermé';
  return hours.replace(/(\d{2})(\d{2})-(\d{2})(\d{2})/, '$1:$2 - $3:$4');
};

const getDaySchedule = (hours: any): string[] => {
  if (!hours) return [];
  const days = [
    { name: 'Lundi', value: hours.Monday },
    { name: 'Mardi', value: hours.Tuesday },
    { name: 'Mercredi', value: hours.Wednesday },
    { name: 'Jeudi', value: hours.Thursday },
    { name: 'Vendredi', value: hours.Friday },
    { name: 'Samedi', value: hours.Saturday },
    { name: 'Dimanche', value: hours.Sunday },
  ];
  return days.map(day => `${day.name}: ${formatOpeningHours(day.value)}`);
};

const normalizeCountryCode = (country: string): string => {
  if (!country) return 'FR';

  const normalized = country.toUpperCase().trim();

  if (normalized.length === 2) {
    return normalized;
  }

  const countryMap: Record<string, string> = {
    'FRANCE': 'FR',
    'BELGIQUE': 'BE',
    'BELGIUM': 'BE',
    'LUXEMBOURG': 'LU',
    'ESPAGNE': 'ES',
    'SPAIN': 'ES',
    'PAYS-BAS': 'NL',
    'NETHERLANDS': 'NL',
    'ALLEMAGNE': 'DE',
    'GERMANY': 'DE',
    'ITALIE': 'IT',
    'ITALY': 'IT',
    'PORTUGAL': 'PT',
    'SUISSE': 'CH',
    'SWITZERLAND': 'CH',
  };

  return countryMap[normalized] || 'FR';
};

export default function MondialRelaySelector({
  postalCode: initialPostalCode,
  country = 'FR',
  onRelaySelected,
  selectedRelay,
}: MondialRelaySelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [searchPostalCode, setSearchPostalCode] = useState(initialPostalCode);
  const [expandedRelay, setExpandedRelay] = useState<string | null>(null);

  const normalizedCountry = normalizeCountryCode(country);

  const searchRelayPoints = async (postcode: string) => {
    if (!postcode || postcode.length < 4) {
      setError('Veuillez saisir un code postal valide (minimum 4 caractères)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mondial-relay-api/pickup-points`;
      const fullUrl = `${apiUrl}?postcode=${postcode}&country=${normalizedCountry}&radius=20000`;

      console.log('Fetching from URL:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const responseText = await response.text();
        console.error('API Error Response (text):', responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Unknown error' };
        }

        console.error('API Error Response (parsed):', errorData);
        const errorMessage = errorData.error || errorData.details || 'Erreur lors de la recherche des points relais';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API Success Response:', data);

      if (data.PickupPoints && Array.isArray(data.PickupPoints)) {
        setRelayPoints(data.PickupPoints);
        if (data.PickupPoints.length === 0) {
          setError('Aucun point relais trouvé pour ce code postal. Essayez un code postal voisin.');
        }
      } else {
        setError('Aucun point relais trouvé pour ce code postal.');
        setRelayPoints([]);
      }
    } catch (err) {
      console.error('Error searching relay points:', err);
      setError('Erreur lors de la recherche des points relais. Veuillez réessayer.');
      setRelayPoints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPostalCode && initialPostalCode.length >= 4) {
      searchRelayPoints(initialPostalCode);
    }
  }, [initialPostalCode, normalizedCountry]);

  const handleSearch = () => {
    searchRelayPoints(searchPostalCode);
  };

  const handleSelectRelay = (relay: RelayPoint) => {
    const formattedRelay = {
      ...relay,
      Num: relay.Id,
      LgAdr1: relay.Name,
      LgAdr2: relay.Address1,
      CP: relay.PostCode,
      Ville: relay.City,
      Pays: relay.Country,
    };
    onRelaySelected(formattedRelay);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#b8933d]" />
          Sélectionner un point relais Mondial Relay
        </CardTitle>
        <CardDescription>
          Recherchez et choisissez le point relais le plus proche de chez vous
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Code postal ou ville"
            value={searchPostalCode}
            onChange={(e) => setSearchPostalCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-[#b8933d] hover:bg-[#9a7a32]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {selectedRelay && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-1">
                <p className="font-semibold">Point relais sélectionné</p>
                <p className="text-sm">{selectedRelay.LgAdr1 || selectedRelay.Name}</p>
                <p className="text-sm">
                  {selectedRelay.CP || selectedRelay.PostCode} {selectedRelay.Ville || selectedRelay.City}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
            <span className="ml-3 text-gray-600">Recherche en cours...</span>
          </div>
        )}

        {!loading && relayPoints.length > 0 && (
          <ScrollArea className="h-[500px] w-full rounded-md border">
            <div className="space-y-3 p-4">
              {relayPoints.map((relay) => {
                const isSelected = selectedRelay?.Id === relay.Id || selectedRelay?.Num === relay.Id;
                const isExpanded = expandedRelay === relay.Id;

                return (
                  <Card
                    key={relay.Id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-[#b8933d] border-2 bg-amber-50' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-5 w-5 text-[#b8933d] mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg leading-tight">{relay.Name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{relay.Address1}</p>
                                {relay.Address2 && (
                                  <p className="text-sm text-gray-600">{relay.Address2}</p>
                                )}
                                <p className="text-sm text-gray-600">
                                  {relay.PostCode} {relay.City}
                                </p>
                              </div>
                            </div>

                            {relay.Distance && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Navigation className="h-4 w-4" />
                                <span>{(relay.Distance / 1000).toFixed(1)} km</span>
                              </div>
                            )}

                            {relay.LocalizationHints && relay.LocalizationHints.length > 0 && (
                              <p className="text-sm text-gray-500 italic">
                                {relay.LocalizationHints.join(', ')}
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleSelectRelay(relay)}
                            className={
                              isSelected
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-[#b8933d] hover:bg-[#9a7a32]'
                            }
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Sélectionné
                              </>
                            ) : (
                              'Choisir'
                            )}
                          </Button>
                        </div>

                        {relay.OpeningHours && (
                          <div className="pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRelay(isExpanded ? null : relay.Id);
                              }}
                              className="text-sm text-gray-600 hover:text-[#b8933d] p-0 h-auto"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              {isExpanded ? 'Masquer les horaires' : 'Voir les horaires'}
                            </Button>

                            {isExpanded && (
                              <div className="mt-3 space-y-1 text-sm">
                                {getDaySchedule(relay.OpeningHours).map((schedule, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between py-1 border-b last:border-0"
                                  >
                                    <span className="font-medium text-gray-700">
                                      {schedule.split(':')[0]}:
                                    </span>
                                    <span className="text-gray-600">
                                      {schedule.split(':').slice(1).join(':')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {!loading && relayPoints.length === 0 && !error && searchPostalCode && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Effectuez une recherche pour trouver des points relais</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
