import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CGVPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l&apos;accueil
        </Button>
      </Link>

      <h1 className="text-4xl font-bold text-gray-900 mb-8">Conditions générales de vente</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 1 - Objet</h2>
          <p className="text-gray-600">
            Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre
            MORGANE DEWANIN, société par actions simplifiée, 1062 rue d&apos;Armentières, 59850 Nieppe,
            SIRET 907 889 802 00027 (ci-après « le Vendeur ») et toute personne physique ou morale souhaitant
            effectuer un achat via le site internet La Boutique de Morgane (ci-après « l&apos;Acheteur »).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 2 - Prix</h2>
          <p className="text-gray-600">
            Les prix de nos produits sont indiqués en euros toutes taxes comprises (TTC). Le Vendeur se réserve
            le droit de modifier ses prix à tout moment, tout en garantissant à l&apos;Acheteur l&apos;application
            du prix en vigueur au moment de la commande.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 3 - Commandes</h2>
          <p className="text-gray-600 mb-3">
            Pour commander sur notre site, vous devez :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Créer un compte client ou commander en tant qu&apos;invité</li>
            <li>Sélectionner les produits souhaités</li>
            <li>Valider votre panier</li>
            <li>Renseigner vos informations de livraison</li>
            <li>Choisir votre mode de paiement</li>
            <li>Confirmer votre commande</li>
          </ul>
          <p className="text-gray-600 mt-3">
            Toute commande vaut acceptation des présentes CGV.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 4 - Validation de la commande</h2>
          <p className="text-gray-600">
            La vente ne sera considérée comme définitive qu&apos;après l&apos;envoi à l&apos;Acheteur d&apos;une confirmation
            de l&apos;acceptation de la commande par le Vendeur par courrier électronique et après encaissement de l&apos;intégralité
            du prix.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 5 - Modalités de paiement</h2>
          <p className="text-gray-600 mb-3">
            Le paiement peut s&apos;effectuer par :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Carte bancaire (Visa, Mastercard, American Express)</li>
            <li>PayPal</li>
            <li>Virement bancaire</li>
          </ul>
          <p className="text-gray-600 mt-3">
            Les paiements effectués par carte bancaire sont sécurisés par notre prestataire Stripe.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 6 - Livraison</h2>
          <p className="text-gray-600">
            Les produits sont livrés à l&apos;adresse indiquée par l&apos;Acheteur lors de la commande.
            Les délais de livraison sont indiqués sur la fiche produit et lors du processus de commande.
            Ils sont donnés à titre indicatif et peuvent varier en fonction de la disponibilité des produits.
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mt-4">
            <p className="text-gray-700"><strong>Frais de livraison :</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
              <li>France métropolitaine : 4,90 € (gratuit à partir de 50 €)</li>
              <li>DOM-TOM : 12,90 €</li>
              <li>Europe : 9,90 €</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 7 - Droit de rétractation</h2>
          <p className="text-gray-600">
            Conformément à l&apos;article L221-18 du Code de la consommation, vous disposez d&apos;un délai de 14 jours
            à compter de la réception de votre commande pour exercer votre droit de rétractation sans avoir à justifier
            de motifs ni à payer de pénalité.
          </p>
          <p className="text-gray-600 mt-3">
            Pour exercer ce droit, vous devez nous notifier votre décision par email à : <a href="mailto:retour@exemple.fr" className="text-blue-600 hover:underline">retour@exemple.fr</a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 8 - Garanties</h2>
          <p className="text-gray-600">
            Tous nos produits bénéficient de la garantie légale de conformité et de la garantie des vices cachés,
            prévues par les articles 1641 et suivants du Code civil et les articles L217-4 et suivants du Code de la consommation.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 9 - Réclamations</h2>
          <p className="text-gray-600">
            Pour toute réclamation ou question, vous pouvez nous contacter :
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mt-4">
            <p className="text-gray-700"><strong>Email :</strong> <a href="mailto:contact@laboutiquedemorgane.fr" className="text-blue-600 hover:underline">contact@laboutiquedemorgane.fr</a></p>
            <p className="text-gray-700"><strong>Téléphone :</strong></p>
            <p className="text-gray-700 ml-4"><a href="tel:+33641456671" className="text-blue-600 hover:underline"><strong>Morgane</strong> : +33 6 41 45 66 71</a></p>
            <p className="text-gray-700 ml-4"><a href="tel:+33603489600" className="text-blue-600 hover:underline"><strong>André</strong> : +33 6 03 48 96</a></p>
            <p className="text-gray-700"><strong>Courrier :</strong> 1062 rue d&apos;Armentières, 59850 Nieppe</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 10 - Données personnelles</h2>
          <p className="text-gray-600">
            Les données personnelles collectées lors de votre commande sont nécessaires au traitement de celle-ci.
            Elles sont destinées au Vendeur et à ses prestataires. Pour plus d&apos;informations, consultez notre{' '}
            <Link href="/politique-confidentialite" className="text-blue-600 hover:underline">
              politique de confidentialité
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 11 - Loi applicable</h2>
          <p className="text-gray-600">
            Les présentes CGV sont soumises à la loi française. En cas de litige, une solution amiable sera recherchée
            avant toute action judiciaire. À défaut, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <section>
          <p className="text-sm text-gray-500 mt-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </section>
      </div>
    </div>
  );
}
