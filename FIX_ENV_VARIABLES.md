# Correction des Variables d'Environnement

## Problème détecté

Il manque une variable d'environnement critique dans votre fichier `.env` :

**`SUPABASE_SERVICE_ROLE_KEY`**

Cette variable est nécessaire pour :
- L'API des factures (`/api/invoices`)
- Les opérations administratives sur la base de données
- La gestion des commandes et des utilisateurs

## Solution

### Étape 1 : Récupérer la clé Service Role de Supabase

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez la clé **service_role** (⚠️ Attention : cette clé a tous les droits, ne la partagez jamais)

### Étape 2 : Ajouter la variable dans .env

Ouvrez votre fichier `.env` et ajoutez la ligne suivante :

```bash
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_ici
```

La ligne devrait ressembler à ceci :

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbmRsZWZvcHJodHJweG51bXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkzODc5OSwiZXhwIjoyMDgwNTE0Nzk5fQ.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Étape 3 : Redémarrer le serveur

Après avoir ajouté la variable :

1. Arrêtez le serveur de développement (Ctrl+C)
2. Redémarrez-le avec `npm run dev`

## Vérification

Une fois la variable ajoutée et le serveur redémarré :

1. Les catégories devraient s'afficher correctement dans les pages de modification de produits
2. L'API des factures devrait fonctionner sans erreur 500
3. La gestion des commandes devrait fonctionner normalement

## Autres problèmes identifiés

### Erreur CORS sur les images WordPress

Si vous voyez cette erreur dans la console :
```
Access to image at 'https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/Logo-BDC.png'
from origin 'https://laboutiquedemorgane.com' has been blocked by CORS policy
```

**Solution** : Ajoutez les en-têtes CORS dans votre configuration WordPress/Apache sur O2Switch.

Dans votre fichier `.htaccess` de WordPress, ajoutez :

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://laboutiquedemorgane.com"
    Header set Access-Control-Allow-Methods "GET, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>
```

## Support

Si le problème persiste après avoir suivi ces étapes, vérifiez :

1. Que toutes les variables d'environnement de `.env.example` sont présentes dans `.env`
2. Qu'il n'y a pas d'espaces en trop avant ou après les valeurs
3. Que le serveur a bien été redémarré après les modifications
