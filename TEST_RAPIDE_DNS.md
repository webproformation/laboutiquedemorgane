# Tests Rapides - Vérification DNS et Supabase

## ✅ Test 1 : Vérifier où pointent les DNS

### Ouvrez ce site dans votre navigateur :
**https://www.whatsmydns.net/#A/laboutiquedemorgane.com**

**Résultat attendu :**
- Vous devez voir des adresses IP o2switch (généralement `54.36.x.x` ou similaire)
- Si vous voyez encore des IP différentes, les DNS n'ont pas encore propagé

---

## ✅ Test 2 : Vérifier quelle instance Supabase est utilisée (1 minute)

### Méthode A : Via le navigateur (RECOMMANDÉ)

1. Ouvrez : **https://laboutiquedemorgane.com**
2. Faites **clic droit > Inspecter** (ou appuyez sur **F12**)
3. Allez dans l'onglet **Console**
4. Collez ce code et appuyez sur **Entrée** :

```javascript
fetch('/_next/static/chunks/').then(() => {
  const scripts = document.querySelectorAll('script[src]');
  let found = false;
  scripts.forEach(script => {
    fetch(script.src).then(r => r.text()).then(text => {
      if(text.includes('supabase.co')) {
        if(text.includes('xaldjtbabtlmdroshzux')) {
          console.log('✅ CORRECT : Utilise xaldjtbabtlmdroshzux (nouvelle instance)');
          found = true;
        }
        if(text.includes('hondlefoprhtrpxnumyj')) {
          console.log('❌ ERREUR : Utilise encore l\'ancienne instance hondlefoprhtrpxnumyj');
          found = true;
        }
      }
    });
  });
});

// Test direct
console.log('En attente des résultats...');
setTimeout(() => {
  console.log('Recherche dans le code source...');
}, 2000);
```

### Méthode B : Plus simple - Via l'onglet Network

1. Ouvrez : **https://laboutiquedemorgane.com**
2. Appuyez sur **F12**
3. Allez dans l'onglet **Network** (Réseau)
4. Actualisez la page (**F5**)
5. Dans le filtre en haut, tapez : **supabase**
6. Regardez les URLs des requêtes

**✅ CORRECT si vous voyez :**
```
https://xaldjtbabtlmdroshzux.supabase.co/...
```

**❌ PROBLÈME si vous voyez :**
```
https://hondlefoprhtrpxnumyj.supabase.co/...
```

### Méthode C : Via le code source

1. Allez sur : **https://laboutiquedemorgane.com**
2. Faites **clic droit > Afficher le code source de la page**
3. Appuyez sur **Ctrl+F** (ou Cmd+F sur Mac)
4. Cherchez : `supabase.co`
5. Regardez quelle URL apparaît

---

## ✅ Test 3 : Vérifier le fichier .env sur le serveur

### Via cPanel :

1. Connectez-vous à **cPanel o2switch**
2. Ouvrez **Gestionnaire de fichiers**
3. Naviguez vers : `/home/keku4513/laboutiquedemorgane.com/`
4. Trouvez le fichier `.env` (activez "Afficher les fichiers cachés" si besoin)
5. Faites **clic droit > Edit**
6. Vérifiez cette ligne :

**✅ DOIT ÊTRE :**
```
NEXT_PUBLIC_SUPABASE_URL=https://xaldjtbabtlmdroshzux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5oj7ecUlHZEaH1e61lDJTA_EfZbWAy6
```

**❌ SI C'EST :**
```
NEXT_PUBLIC_SUPABASE_URL=https://hondlefoprhtrpxnumyj.supabase.co
```
→ **Il faut corriger !**

---

## ✅ Test 4 : Vérifier l'application Node.js

### Via cPanel :

1. Connectez-vous à **cPanel o2switch**
2. Cherchez : **Setup Node.js App**
3. Regardez votre application

**✅ DOIT AFFICHER :**
- **Status** : 🟢 Running (En cours d'exécution)
- **Application root** : `laboutiquedemorgane.com`
- **Node.js version** : 18.x ou 20.x

4. Cliquez sur **Edit** (le crayon)
5. Dans la section **Environment variables**, vérifiez :

```
NEXT_PUBLIC_SUPABASE_URL = https://xaldjtbabtlmdroshzux.supabase.co
```

---

## 🔧 Si vous trouvez des erreurs :

### Si vous utilisez encore l'ancienne instance :

**Solution rapide :**

1. **Via cPanel > Gestionnaire de fichiers**
   - Éditez le fichier `.env`
   - Remplacez l'ancienne URL par `xaldjtbabtlmdroshzux`
   - Sauvegardez

2. **Via cPanel > Setup Node.js App**
   - Cliquez sur **Edit** (votre app)
   - Dans **Environment variables**
   - Changez `NEXT_PUBLIC_SUPABASE_URL` pour : `https://xaldjtbabtlmdroshzux.supabase.co`
   - Cliquez sur **Save**
   - Cliquez sur **Restart** (redémarrer l'application)

3. **Rebuild local et re-upload**
   - Sur votre ordinateur local :
     ```bash
     # Vérifier que .env contient xaldjtbabtlmdroshzux
     npm run build
     ```
   - Supprimez le dossier `.next/` sur o2switch
   - Ré-uploadez le nouveau `.next/` via FTP
   - Redémarrez l'app dans cPanel

---

## 📊 Résumé des vérifications

| Test | Outil | Ce que vous devez voir |
|------|-------|------------------------|
| **DNS** | whatsmydns.net | IP o2switch (54.36.x.x) |
| **Supabase** | Network (F12) | xaldjtbabtlmdroshzux.supabase.co |
| **Fichier .env** | cPanel | NEXT_PUBLIC_SUPABASE_URL=...xaldjtbabtlmdroshzux |
| **Application** | Setup Node.js App | Status: Running 🟢 |

---

## ⚡ Test ultra-rapide (10 secondes)

Ouvrez simplement votre navigateur en mode privé :
**https://laboutiquedemorgane.com**

- ✅ **Si le site charge normalement** → Probablement OK
- ❌ **Si erreur 404 / 500 / site vide** → Problème de configuration
- ❌ **Si vous voyez l'ancien site WordPress** → DNS pas encore propagés

Ensuite faites F12 > Network > cherchez "supabase" pour voir quelle instance est utilisée.
