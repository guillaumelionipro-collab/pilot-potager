# 🚀 Feuille de route — Publication de Pilot Potager sur Google Play

Guide pas-à-pas, dans l'ordre exact à suivre. Chaque étape précise :
- 🤖 **Fait par moi** (déjà prêt dans le code)
- 🙋 **À faire par vous** (compte, paiement, validation humaine — je vous guide précisément)
- 🤝 **On le fait ensemble** (je prépare, vous exécutez avec moi à côté)

---

## PHASE 0 — Où on en est ✅ (déjà fait)

🤖 Application complète (Freemium/Premium, IA sécurisée, gamification, stats…)
🤖 Projet Android généré (Capacitor) avec icônes, splash, permissions
🤖 Système de comptes (Supabase Auth) + abonnement Google Play (RevenueCat) câblés
🤖 Politique de confidentialité publiée : https://pilot-potager.vercel.app/privacy.html
🤖 Fiche Store rédigée : `store/play-store-listing.md`

---

## PHASE 1 — Créer les comptes nécessaires 🙋

Vous seul pouvez créer ces comptes (ils nécessitent une identité/un paiement réels).

### 1.1 Compte développeur Google Play (obligatoire)
1. Allez sur https://play.google.com/console/signup
2. Connectez-vous avec le compte Google que vous voulez utiliser pour publier
3. Payez les **25 $ US** de frais d'inscription unique (carte bancaire)
4. Remplissez l'identité du développeur (nom, adresse — visible publiquement si compte "individuel")
5. Attendez la validation (généralement instantanée à 48h)

➡️ **Dites-moi quand c'est fait**, je vous aide pour la suite.

### 1.2 Compte RevenueCat (gratuit)
1. Inscrivez-vous sur https://app.revenuecat.com/signup
2. Créez un projet "Pilot Potager"
3. **Ne configurez pas encore Google Play dedans** — on le fera ensemble en Phase 4 (il faut d'abord le produit Play Console)

### 1.3 Adresse e-mail de contact
Décidez d'une adresse pour le support/la fiche Store (ex. `contact@pilotpotager.app`,
ou simplement votre Gmail si vous n'avez pas de domaine). On mettra à jour
`public/privacy.html` et `store/play-store-listing.md` avec la bonne adresse.

---

## PHASE 2 — Outils de build Android 🙋 (avec mon assistance)

Pour transformer le code en fichier `.aab` (Android App Bundle) signé, il faut
**Android Studio** (qui embarque le JDK, Gradle, et les outils de signature).
Je n'ai pas pu détecter Java/Android Studio sur cette machine — il faut l'installer :

1. Téléchargez Android Studio : https://developer.android.com/studio
2. Installez-le (acceptez les composants par défaut : SDK Android, émulateur…)
3. Une fois installé, dites-le-moi : je vous donnerai la commande exacte pour
   ouvrir le projet (`npx cap open android`) et je vous guiderai dans l'interface
   pour générer la **clé de signature** (keystore) et le **bundle signé**.

> 💡 Vous pouvez faire les Phases 1 et 3 (comptes, fiche Store, visuels) **pendant
> que l'installation d'Android Studio se fait en arrière-plan** — c'est long (plusieurs Go).

---

## PHASE 3 — Préparer les visuels et le contenu 🤝

### 3.1 Captures d'écran (vous + moi)
Je peux generer les captures via l'aperçu navigateur de l'app (déjà fait pour
certaines pages pendant nos tests). Dites-moi quand vous voulez qu'on les
prenne ensemble — je naviguerai dans l'app et capturerai les 7 écrans suggérés
dans `store/play-store-listing.md`.

### 3.2 Image de présentation (feature graphic) 1024×500
🙋 Un visuel marketing avec accroche. Je peux vous **générer un brouillon HTML/CSS**
que vous pourrez convertir en image, ou vous pouvez utiliser Canva (gratuit,
modèles "Google Play feature graphic" disponibles).

### 3.3 Vidéo de démo (facultatif)
🙋 Optionnel — un enregistrement d'écran de 30-60s suffit (ex. avec l'enregistreur
d'écran de votre téléphone une fois l'app installée).

---

## PHASE 4 — Configurer le produit d'abonnement 🤝

Une fois le compte Play Console actif (Phase 1.1) :

1. **Dans Play Console** : Créez l'application "Pilot Potager" (nom, langue par défaut français,
   type "Application", gratuite avec achats intégrés)
2. **Monétisation → Produits → Abonnements** : créez `pilot_premium_monthly`
   - Prix : 4,99 € / mois
   - Période d'essai gratuite (optionnel mais recommandé : 7 jours)
3. **Dans RevenueCat** (Phase 1.2) :
   - Connectez le compte de service Google Play (Play Console → Utilisateurs et autorisations
     → créer un compte de service avec accès "Voir les données financières" + "Gérer les commandes
     et les abonnements")
   - Importez le produit `pilot_premium_monthly`
   - Créez l'**entitlement** `premium` et associez-le au produit
   - Récupérez la **clé publique SDK** (Project settings → API keys → "Public Google Play API key")

➡️ Une fois que vous avez cette clé, on l'ajoute ensemble :
```
VITE_REVENUECAT_PUBLIC_SDK_KEY=goog_xxxxxxxxxxxx
```
dans `.env` et dans les variables d'environnement Vercel — puis je redéploie.

4. **Webhook RevenueCat → Supabase** : dans RevenueCat (Project → Integrations → Webhooks),
   ajoutez l'URL `https://lxwcnebbvbeegorknlwn.supabase.co/functions/v1/revenuecat-webhook`
   avec un en-tête `Authorization: Bearer <secret-partagé>`. Je déploierai la fonction et
   configurerai le secret correspondant côté Supabase à ce moment-là.

---

## PHASE 5 — Build & signature de l'app 🤝 (une fois Android Studio installé)

1. `npm run build && npx cap sync android`
2. `npx cap open android` → ouvre Android Studio
3. **Build → Generate Signed Bundle / APK** :
   - Choisir **Android App Bundle**
   - Créer une **nouvelle clé** (keystore) — ⚠️ **sauvegardez ce fichier et son mot de
     passe précieusement** (coffre-fort, gestionnaire de mots de passe). Si vous le perdez,
     vous ne pourrez plus jamais publier de mise à jour de l'app !
   - Choisir le type de build "release"
4. Le fichier `.aab` signé est généré dans `android/app/release/`

Je vous accompagnerai à l'écran à chaque sous-étape (quoi cliquer, quoi remplir).

---

## PHASE 6 — Soumettre sur Play Console 🙋 (avec mon contenu prêt)

1. **Présence sur le Store → Fiche principale** : copier-coller le contenu de
   `store/play-store-listing.md` (nom, descriptions, mots-clés)
2. **Importer les visuels** (icône, feature graphic, captures)
3. **Politique de confidentialité** : coller `https://pilot-potager.vercel.app/privacy.html`
4. **Classification du contenu** : répondre au questionnaire IARC (aucun contenu sensible →
   "Tout public" attendu)
5. **Sécurité des données** : suivre la section dédiée de `store/play-store-listing.md`
6. **Achats intégrés** : déclarer l'abonnement Premium 4,99 €/mois
7. **Versions de l'app → Tests → Test interne** : créez une piste de test interne, ajoutez
   votre propre adresse e-mail comme testeur, téléversez le `.aab`
8. Testez l'app installée depuis le lien de test interne (achat test, connexion, IA…)
9. Une fois satisfait → **promouvoir vers Production** (ou passer par un test fermé/ouvert
   d'abord, recommandé pour récolter les premiers retours)

---

## PHASE 7 — Lancement & promotion 🙋 (avec mon plan déjà fourni)

Voir le plan de promotion détaillé donné précédemment (ASO, réseaux sociaux,
communautés jardinage, offre de lancement, etc.). On pourra aussi préparer
ensemble les visuels/textes des posts de lancement le moment venu.

---

## 🗺️ Par où commencer maintenant ?

Je vous recommande de lancer **en parallèle** :
- 🙋 **Phase 1.1** (créer le compte Google Play — ça prend du temps à valider, autant commencer tout de suite)
- 🙋 **Phase 2** (télécharger Android Studio — gros téléchargement, à lancer en fond)
- 🤝 **Phase 3.1** (on peut prendre les captures d'écran ensemble dès maintenant, ça ne dépend de rien d'autre)

Dites-moi par laquelle vous voulez commencer, ou si vous avez déjà un compte
développeur Google Play / Android Studio installé !
