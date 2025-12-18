import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Le Droit à l'Erreur - La Boutique de Morgane",
  description: "Retourner un article ? On s'arrange en douceur.",
};

export default function LeDroitALerreurPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <img
              src="https://laboutiquedemorgane.webprocreation.fr/wp-content/uploads/2025/12/La-boutique-de-Morgane-Le-droit-a-lerreur.png"
              alt="Le Droit à l'Erreur"
              className="w-20 h-20 mx-auto mb-6 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Retourner un article ? On s'arrange en douceur.
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Oups, le coup de cœur n'a pas opéré une fois porté ? Cela arrive même aux meilleures ! Chez Morgane, vous avez 14 jours après réception pour nous signaler un retour.
              </p>
            </div>

            <div className="border-l-4 border-[#C6A15B] pl-6 py-4 bg-[#C6A15B]/5">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Option 1 : L'Avoir « Shopping Lovers » (Recommandé)
              </h2>
              <p className="text-gray-700 mb-4 font-medium">
                C'est la solution préférée de nos clientes !
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-[#C6A15B] font-bold mt-1">•</span>
                  <span><strong>Rapidité :</strong> Dès réception de votre retour, votre avoir est crédité sur votre compte client.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C6A15B] font-bold mt-1">•</span>
                  <span><strong>Validité :</strong> Utilisable pendant 1 an sur toute la boutique (Mode, Beauté, Maison).</span>
                </li>
              </ul>
            </div>

            <div className="border-l-4 border-gray-300 pl-6 py-4 bg-gray-50">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Option 2 : Le Remboursement Classique
              </h2>
              <p className="text-gray-700 mb-4">
                Vous préférez être remboursée ? Pas de souci.
              </p>
              <p className="text-gray-700">
                Le remboursement est effectué sur le moyen de paiement utilisé lors de la commande, sous 14 jours maximum après réception et vérification de vos articles.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                La marche à suivre :
              </h2>
              <ol className="space-y-4 text-gray-700">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#C6A15B] text-white font-semibold">1</span>
                  <span className="pt-1">Envoyez un petit mail à <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">contact@laboutiquedemorgane.com</a> avec votre numéro de commande en précisant si vous préférez un Avoir ou un Remboursement.</span>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#C6A15B] text-white font-semibold">2</span>
                  <span className="pt-1">Nous vous validons le retour par email.</span>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#C6A15B] text-white font-semibold">3</span>
                  <span className="pt-1">Glissez les articles (non portés, avec étiquettes) dans leur emballage.</span>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#C6A15B] text-white font-semibold">4</span>
                  <span className="pt-1">Renvoyez-les-nous à l'adresse suivante : <strong>1062 Rue d'Armentières, 59850 Nieppe</strong></span>
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Note :</strong> Conformément à nos CGV, les frais de retour restent à votre charge. Les produits cosmétiques, sous-vêtements et boucles d'oreilles descellés ne peuvent être repris par mesure d'hygiène.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
