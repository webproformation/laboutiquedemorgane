'use client';

import { useLoyalty } from '@/context/LoyaltyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Gift, Sparkles, Eye, Video, TrendingUp, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoyaltyPage() {
  const {
    loyaltyPoints,
    loading,
    visitDiscount,
    liveDiscount,
    totalDiscount,
    progressToNextVisitDiscount,
  } = useLoyalty();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const pointsToNextDiscount = loyaltyPoints
    ? (Math.floor(loyaltyPoints.page_visit_points / 500) + 1) * 500 - loyaltyPoints.page_visit_points
    : 500;

  const livesUntilMaxDiscount = Math.max(0, 5 - (loyaltyPoints?.live_participation_count || 0));
  const pointsUntilMaxDiscount = Math.max(0, 1500 - (loyaltyPoints?.page_visit_points || 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Programme de Fidélité</h1>
        <p className="text-gray-600">
          Gagnez des points et des réductions en naviguant sur le site et en participant aux lives
        </p>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 rounded-full p-3">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Votre Réduction Actuelle</CardTitle>
              <CardDescription>Cumulez visites et participations aux lives</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-6xl font-bold text-amber-600">
              {totalDiscount}%
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Eye className="h-4 w-4" />
                    <span>Visites</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">{visitDiscount}%</div>
                  <div className="text-xs text-gray-500">Max 3%</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Video className="h-4 w-4" />
                    <span>Lives</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">{liveDiscount}%</div>
                  <div className="text-xs text-gray-500">Max 5%</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-600" />
              <CardTitle>Points de Visites</CardTitle>
            </div>
            <CardDescription>1 visite = 1 point, 500 points = 1% de réduction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progression</span>
                <span className="text-2xl font-bold text-amber-600">
                  {loyaltyPoints?.page_visit_points || 0}
                </span>
              </div>
              <Progress value={progressToNextVisitDiscount} className="h-3 bg-amber-100" />
              {visitDiscount < 3 ? (
                <p className="text-sm text-gray-600 mt-2">
                  Plus que <span className="font-semibold">{pointsToNextDiscount} points</span> pour atteindre {visitDiscount + 1}%
                </p>
              ) : (
                <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Réduction maximum atteinte!
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Réduction actuelle:</span>
                <span className="font-semibold text-amber-600">{visitDiscount}%</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Réduction maximum:</span>
                <span className="font-semibold">3%</span>
              </div>
            </div>

            {pointsUntilMaxDiscount > 0 && (
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Continuez comme ça!</p>
                    <p className="text-gray-600">
                      Encore {pointsUntilMaxDiscount} points pour la réduction maximum
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-amber-600" />
              <CardTitle>Participations aux Lives</CardTitle>
            </div>
            <CardDescription>1 live = 1% de réduction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Lives regardés</span>
                <span className="text-2xl font-bold text-amber-600">
                  {loyaltyPoints?.live_participation_count || 0}
                </span>
              </div>
              <Progress
                value={((loyaltyPoints?.live_participation_count || 0) / 5) * 100}
                className="h-3 bg-amber-100"
              />
              {liveDiscount < 5 ? (
                <p className="text-sm text-gray-600 mt-2">
                  Plus que <span className="font-semibold">{livesUntilMaxDiscount} live(s)</span> pour atteindre {liveDiscount + 1}%
                </p>
              ) : (
                <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Réduction maximum atteinte!
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Réduction actuelle:</span>
                <span className="font-semibold text-amber-600">{liveDiscount}%</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Réduction maximum:</span>
                <span className="font-semibold">5%</span>
              </div>
            </div>

            {livesUntilMaxDiscount > 0 && (
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Video className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Participez aux lives!</p>
                    <p className="text-gray-600">
                      Encore {livesUntilMaxDiscount} live(s) pour la réduction maximum
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-600" />
            <CardTitle>Comment ça marche?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-amber-100 rounded-full p-2 h-fit">
                <Eye className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Points de Visite</h3>
                <p className="text-sm text-gray-600">
                  Chaque page que vous visitez sur le site vous rapporte 1 point.
                  Accumulez 500 points pour débloquer 1% de réduction sur vos achats.
                  Maximum 3% de réduction (1500 points).
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-amber-100 rounded-full p-2 h-fit">
                <Video className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Participation aux Lives</h3>
                <p className="text-sm text-gray-600">
                  Chaque live auquel vous participez vous donne 1% de réduction supplémentaire.
                  Assistez à 5 lives pour obtenir la réduction maximum de 5%.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-amber-100 rounded-full p-2 h-fit">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Réduction Totale</h3>
                <p className="text-sm text-gray-600">
                  Vos réductions de visite et de lives se cumulent!
                  Obtenez jusqu&apos;à 8% de réduction maximum (3% visites + 5% lives)
                  sur tous vos achats.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
