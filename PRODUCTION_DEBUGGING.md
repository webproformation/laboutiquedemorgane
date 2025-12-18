# Guide de Débogage en Production

## Problèmes identifiés et corrigés

### 1. Images ne chargeant pas en production
**Problème** : Les images WordPress/WooCommerce ne se chargeaient pas en production.

**Cause** : Configuration wildcard `hostname: '**'` non fiable en production.

**Solution** : Domaines explicitement autorisés dans `next.config.js` :
- `laboutiquedemorgane.webprocreation.fr`
- `images.pexels.com`
- Domaines Supabase

### 2. Page Account ne fonctionnant pas
**Problème** : La page `/account` ne fonctionne plus en production après redéploiement.

**Causes possibles identifiées** :
1. Callback async mal géré dans `onAuthStateChange`
2. Requêtes à la base de données sans vérification user ID
3. Session non persistée correctement

**Solutions appliquées** :

#### A. Correction du AuthContext (`context/AuthContext.tsx`)
```typescript
// AVANT (incorrect - cause des deadlocks)
supabase.auth.onAuthStateChange(async (event, session) => {
  await loadProfile(session.user.id);
});

// APRÈS (correct)
supabase.auth.onAuthStateChange((event, session) => {
  (async () => {
    await loadProfile(session.user.id);
  })();
});
```

#### B. Amélioration de la gestion des erreurs
```typescript
const fetchSavingsData = async () => {
  if (!user?.id) {
    console.warn('No user ID available');
    return;
  }
  // ... rest of the code
};
```

## Outils de débogage

### Page de diagnostic créée : `/debug-auth`

Cette page affiche :
- État des variables d'environnement (sans exposer les secrets)
- État du contexte d'authentification
- Session Supabase directe
- Profil utilisateur complet

**Utilisation** :
1. Accédez à `https://votre-site.com/debug-auth`
2. Vérifiez que toutes les variables d'environnement sont "OK"
3. Vérifiez que la session est active
4. Vérifiez que le profil se charge correctement

### Logs en production

Pour voir les logs en production sur Vercel :
1. Allez sur votre dashboard Vercel
2. Cliquez sur votre projet
3. Allez dans "Functions" > "Logs"
4. Filtrez par erreur

## Checklist de déploiement

Avant chaque déploiement, vérifiez :

### Variables d'environnement Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_WORDPRESS_API_URL`
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- [ ] `WORDPRESS_URL`
- [ ] `WORDPRESS_USERNAME`
- [ ] `WORDPRESS_APP_PASSWORD`
- [ ] `WOOCOMMERCE_CONSUMER_KEY`
- [ ] `WOOCOMMERCE_CONSUMER_SECRET`
- [ ] `PAYPAL_CLIENT_SECRET`

### Configuration Next.js
- [ ] Domaines d'images correctement configurés
- [ ] Build passe sans erreur localement
- [ ] Toutes les pages statiques se génèrent

### Configuration Supabase
- [ ] RLS activé sur toutes les tables
- [ ] Policies correctement définies
- [ ] URL CORS configurée pour votre domaine
- [ ] Auth settings configurés (disable email confirmation si nécessaire)

## Problèmes courants et solutions

### "Session expired" en production
**Cause** : Clés d'environnement manquantes ou incorrectes
**Solution** : Vérifier les variables d'environnement sur Vercel

### Page blanche après login
**Cause** : Erreur JavaScript côté client
**Solution** :
1. Ouvrir la console du navigateur (F12)
2. Regarder les erreurs
3. Vérifier le network tab pour les erreurs API

### Images ne chargent pas
**Cause** : Domaine non autorisé dans `next.config.js`
**Solution** : Ajouter le domaine dans `remotePatterns`

### RLS bloque les requêtes
**Cause** : Policies trop restrictives ou user_id non trouvé
**Solution** :
1. Vérifier que `auth.uid()` retourne bien l'ID utilisateur
2. Vérifier les logs Supabase
3. Tester la requête manuellement dans l'éditeur SQL Supabase

## Tests après déploiement

1. **Test de connexion**
   - Se connecter avec un compte existant
   - Vérifier que la redirection fonctionne
   - Vérifier que le profil se charge

2. **Test de la page account**
   - Accéder à `/account`
   - Vérifier que les données se chargent
   - Tester la modification du profil

3. **Test des images**
   - Vérifier que les images produits chargent
   - Vérifier que les images de profil chargent
   - Vérifier les slides de la page d'accueil

4. **Test des fonctionnalités critiques**
   - Panier
   - Wishlist
   - Checkout
   - Lives

## Monitoring continu

### Métriques à surveiller
- Temps de réponse des API
- Taux d'erreur des pages
- Logs d'erreurs JavaScript
- Temps de chargement des images

### Outils recommandés
- Vercel Analytics (inclus)
- Sentry pour le tracking d'erreurs
- Google Analytics pour le comportement utilisateur

## En cas de problème critique

1. **Vérifier le status Supabase** : https://status.supabase.com/
2. **Vérifier le status Vercel** : https://www.vercel-status.com/
3. **Rollback rapide** : Sur Vercel, redéployez la version précédente
4. **Consulter les logs** : Dashboard Vercel > Functions > Logs

## Support

Si le problème persiste :
1. Accéder à `/debug-auth` pour collecter les informations
2. Vérifier les logs Vercel
3. Vérifier les logs Supabase
4. Documenter les étapes pour reproduire le problème
