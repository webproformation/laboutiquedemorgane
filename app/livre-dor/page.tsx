"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem, Heart, ShieldCheck, MessageCircle, ChevronDown, ChevronUp, Facebook } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import OptimizedImage from "@/components/OptimizedImage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GuestbookEntry {
  id: string;
  customer_name: string;
  rating: number;
  message: string;
  photo_url: string | null;
  admin_response: string | null;
  likes_count: number;
  created_at: string;
  approved_at: string;
  source: 'site' | 'facebook';
}

export default function LivreDorPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [likedEntries, setLikedEntries] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCharter, setShowCharter] = useState(false);

  useEffect(() => {
    let storedSessionId = localStorage.getItem("guestbook_session_id");
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("guestbook_session_id", storedSessionId);
    }
    setSessionId(storedSessionId);

    const storedLikes = localStorage.getItem("guestbook_likes");
    if (storedLikes) {
      setLikedEntries(new Set(JSON.parse(storedLikes)));
    }

    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guestbook_entries")
        .select("*")
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching guestbook entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (entryId: string) => {
    if (likedEntries.has(entryId)) {
      toast.error("Vous avez déjà aimé cet avis");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("guestbook_likes").insert({
        entry_id: entryId,
        session_id: sessionId,
      });

      if (error) throw error;

      const newLikedEntries = new Set(likedEntries);
      newLikedEntries.add(entryId);
      setLikedEntries(newLikedEntries);
      localStorage.setItem("guestbook_likes", JSON.stringify(Array.from(newLikedEntries)));

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, likes_count: entry.likes_count + 1 } : entry
        )
      );

      toast.success("Merci d'avoir aimé cet avis !");
    } catch (error) {
      console.error("Error liking entry:", error);
      toast.error("Une erreur est survenue");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Chargement des mots doux...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto mb-12 text-center space-y-6">
        <div className="flex justify-center mb-4">
          <Gem className="h-12 w-12 text-amber-500" />
        </div>
        <h1 className="text-4xl font-bold">Bienvenue dans mon Livre d&apos;Or !</h1>
        <div className="prose prose-lg mx-auto text-left bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-8 rounded-2xl border border-pink-200 dark:border-pink-800">
          <p className="text-base leading-relaxed">
            Parce que vos sourires sont notre plus belle récompense, j&apos;ai créé cet espace pour
            recueillir vos mots doux et vos plus jolis looks. Ici, on ne donne pas des étoiles,
            on partage des <strong>Pépites</strong> !
          </p>
          <p className="text-base leading-relaxed">
            Votre avis est précieux : il aide d&apos;autres clientes à faire leur choix et nous
            permet d&apos;agrandir la famille chaque jour.
          </p>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg my-4">
            <p className="text-base font-semibold mb-2">🎁 Pour vous remercier de votre fidélité :</p>
            <p className="text-sm">• 0,20 € offerts dans votre cagnotte pour chaque mot doux déposé.</p>
          </div>
          <p className="text-base leading-relaxed">
            Merci de faire partie de cette aventure avec nous. Nous avons hâte de vous lire !
          </p>
          <p className="text-base font-semibold text-right">Morgane & doudou 🌸</p>
        </div>

        <Collapsible open={showCharter} onOpenChange={setShowCharter} className="mt-8">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-base font-semibold border-2 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/20"
            >
              Charte de Modération du Livre d&apos;Or
              {showCharter ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="prose prose-sm max-w-none bg-white dark:bg-gray-900 p-8 rounded-2xl border-2 border-amber-200 dark:border-amber-800 space-y-6">
              <p className="text-base leading-relaxed">
                Bienvenue dans l&apos;espace d&apos;expression de La Boutique de Morgane. Pour que ce lieu reste un espace d&apos;amour, de bienveillance et d&apos;authenticité, nous avons mis en place quelques règles simples.
              </p>

              <div>
                <h3 className="text-lg font-bold mb-3">1. Authenticité avant tout</h3>
                <p className="text-sm leading-relaxed">
                  Le Livre d&apos;Or est strictement réservé aux clientes ayant effectué un achat sur notre boutique. Chaque avis est lié à une commande réelle et porte la mention « Achat Vérifié ✅ ». Cela vous garantit que chaque témoignage et chaque photo proviennent d&apos;une expérience vécue.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">2. Processus de Modération</h3>
                <p className="text-sm leading-relaxed mb-2">
                  Afin d&apos;éviter les messages publicitaires indésirables (spams) ou les contenus inappropriés, chaque signature est relue par notre équipe avant publication.
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                  <li><strong>Délai :</strong> Votre avis apparaîtra sous 48h à 72h après sa validation technique.</li>
                  <li><strong>Transparence :</strong> Nous ne sélectionnons pas les avis en fonction de leur note. Un avis moins positif sera publié dès lors qu&apos;il respecte les règles de politesse et de respect.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">3. Motifs de refus d&apos;un avis</h3>
                <p className="text-sm leading-relaxed mb-2">
                  Nous nous réservons le droit de ne pas publier (ou de supprimer) un avis si :
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                  <li>Il contient des propos injurieux, diffamatoires, racistes ou haineux.</li>
                  <li>Il comporte des données personnelles (numéro de téléphone, adresse e-mail, etc.).</li>
                  <li>La photo jointe est de mauvaise qualité, n&apos;appartient pas à l&apos;auteur ou est jugée inappropriée.</li>
                  <li>Le contenu est purement publicitaire ou comporte des liens vers d&apos;autres sites.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">4. Récompenses et Équité</h3>
                <p className="text-sm leading-relaxed">
                  La récompense créditée sur votre cagnotte (0,20€) est offerte en remerciement du temps accordé pour partager votre expérience. Elle n&apos;est en aucun cas conditionnée par l&apos;obtention d&apos;une note positive.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">5. Élection de l&apos;Ambassadrice</h3>
                <p className="text-sm leading-relaxed">
                  L&apos;élection de « L&apos;Ambassadrice de la Semaine » se base sur le nombre de « Cœurs ❤️ » reçus par les autres visiteuses. En cas d&apos;égalité ou de suspicion de fraude (utilisation de robots de vote), l&apos;administrateur de la boutique se réserve le droit de procéder à l&apos;arbitrage final pour désigner la gagnante.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">6. Vos Droits (RGPD)</h3>
                <p className="text-sm leading-relaxed">
                  En signant le Livre d&apos;Or, vous acceptez la publication de votre prénom et de votre photo sur notre site. Vous pouvez à tout moment demander la modification ou la suppression de votre avis en nous contactant via le formulaire de contact.
                </p>
              </div>

              <p className="text-sm text-center font-semibold text-amber-700 dark:text-amber-500 mt-6">
                Merci de contribuer à faire de notre Livre d&apos;Or un lieu bienveillant et authentique ! 💛
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucun avis pour le moment. Soyez la première à laisser un mot doux !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <CardContent className="p-0">
                {entry.photo_url && (
                  <div className="relative h-64 w-full overflow-hidden">
                    <OptimizedImage
                      src={entry.photo_url}
                      alt={`Photo de ${entry.customer_name}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{entry.customer_name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {entry.source === 'facebook' ? (
                          <>
                            <Facebook className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-600">Avis Facebook</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            Achat Vérifié
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: entry.rating }).map((_, i) => (
                        <Gem key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed">{entry.message}</p>

                  {entry.admin_response && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4 rounded-lg border-l-4 border-amber-500">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">
                            Réponse de Morgane :
                          </p>
                          <p className="text-sm text-amber-900 dark:text-amber-300">
                            {entry.admin_response}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.approved_at), "MMMM yyyy", { locale: fr })}
                    </p>
                    <Button
                      variant={likedEntries.has(entry.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLike(entry.id)}
                      disabled={likedEntries.has(entry.id)}
                      className="gap-2"
                    >
                      <Heart
                        className={`h-4 w-4 ${likedEntries.has(entry.id) ? "fill-current" : ""}`}
                      />
                      {entry.likes_count}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
