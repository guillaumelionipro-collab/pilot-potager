# Fiche Google Play — Pilot Potager

Tout ce qu'il faut pour remplir la fiche dans la Play Console
(Présence sur le Store → Fiche principale du Store).

---

## 🏷️ Nom de l'application (30 caractères max)

```
Pilot Potager
```

## ✏️ Description courte (80 caractères max)

```
Carnet de potager intelligent + diagnostic IA de vos plantes en une photo
```
*(74 caractères)*

Variante alternative :
```
Cultivez mieux : suivi de potager, IA de diagnostic, calendrier et conseils
```

---

## 📖 Description complète (4000 caractères max)

```
🌱 PILOT POTAGER — VOTRE CARNET DE CULTURE INTELLIGENT

Que vous ayez un balcon, un petit jardin ou un grand potager, Pilot Potager
vous accompagne au quotidien : suivi de vos cultures, rappels au bon moment,
diagnostic de vos plantes par intelligence artificielle, et bien plus.

📸 ANALYSE IA — DIAGNOSTIQUEZ VOS PLANTES EN UNE PHOTO
Prenez une photo et obtenez en quelques secondes :
• L'identification de la plante et son état de santé (score sur 100)
• Les maladies ou carences détectées, avec leur niveau d'urgence
• Des conseils d'arrosage, d'exposition et d'engrais personnalisés
• Une estimation de la date de récolte

🌿 MON POTAGER AUJOURD'HUI
Chaque matin, retrouvez en un coup d'œil ce qu'il y a à faire : arrosages,
plantes à surveiller, récoltes imminentes, et une suggestion intelligente
adaptée à la saison.

✅ SUIVI COMPLET DE VOTRE POTAGER
• Calendrier de plantation, de semis et de récolte
• Carnet de journal photo pour suivre l'évolution de vos cultures
• Gestion des zones, des stocks de graines et du matériel
• Bibliothèque de fiches pratiques pour des dizaines de légumes

🔔 NOTIFICATIONS INTELLIGENTES
Ne ratez plus jamais un arrosage, une récolte ou un traitement : l'application
vous prévient au bon moment, en fonction de vos cultures et de la météo locale.

📊 STATISTIQUES & PROGRESSION
Suivez vos récoltes (poids, quantités), votre taux de réussite, et débloquez
des niveaux et des badges au fil de votre progression de jardinier.

🌟 PILOT PREMIUM
Passez à la version Premium pour profiter d'analyses IA illimitées, de
prévisions de récolte, de statistiques avancées, d'une météo personnalisée et
d'une sauvegarde cloud de toutes vos données. Abonnement mensuel sans
engagement, géré simplement via Google Play.

🔒 VOS DONNÉES VOUS APPARTIENNENT
Toutes vos données restent stockées localement sur votre téléphone par défaut.
Créez un compte (facultatif) pour activer la sauvegarde cloud et la synchronisation
entre appareils. Exportez ou supprimez vos données à tout moment depuis les
paramètres.

Que vous soyez débutant ou jardinier expérimenté, Pilot Potager vous aide à
cultiver avec plus de confiance, moins d'erreurs, et plus de récoltes. 🍅🥕🌻

Téléchargez Pilot Potager dès maintenant et faites de votre potager un vrai succès !
```

---

## 🔑 Mots-clés / thématiques à cibler (ASO)

Intégrez naturellement ces expressions dans la description (déjà fait
ci-dessus) et sélectionnez les catégories/tags pertinents dans la Play Console :

- potager, jardinage, jardin, carnet de jardin
- plantes, maladies des plantes, diagnostic plante
- semis, calendrier de plantation, récolte
- IA, intelligence artificielle, analyse photo
- légumes, balcon, jardin urbain, permaculture

**Catégorie suggérée** : Maison et jardin (Lifestyle / House & Home)

---

## 🖼️ Visuels à préparer

| Élément | Format / taille | Contenu suggéré |
|---|---|---|
| Icône de l'app | 512×512 px PNG (généré ✅ `assets/icon.png`) | Logo feuille sur fond vert pin |
| Image de présentation (feature graphic) | 1024×500 px | Visuel + accroche "Diagnostiquez vos plantes en une photo 🌱" |
| Captures d'écran téléphone | min. 2, recommandé 6-8 — 1080×1920 px ou ratio 16:9/9:16 | Voir liste ci-dessous |
| Vidéo de démonstration (facultatif mais recommandé) | Lien YouTube, 30-60s | Montrer le scan IA en action + tableau de bord |

### Suggestions de captures d'écran (dans cet ordre, avec un titre overlay court)
1. **"Mon Potager Aujourd'hui"** — le tableau de bord du jour
2. **"Diagnostiquez vos plantes en une photo"** — la fiche IA premium (score de santé, maladies, conseils)
3. **"Ne ratez plus jamais un arrosage"** — les notifications intelligentes
4. **"Suivez vos récoltes et vos statistiques"** — page Statistiques
5. **"Calendrier et rappels de saison"** — page Calendrier/Planification
6. **"Progressez et débloquez des badges"** — page Niveau Jardinier
7. **"Passez Premium en un clic via Google Play"** — page Pilot Premium

---

## 🔗 Liens et informations obligatoires (Play Console)

| Champ | Valeur |
|---|---|
| Politique de confidentialité (URL publique) | `https://pilot-potager.vercel.app/privacy.html` *(fichier déjà créé : `public/privacy.html`)* |
| Adresse e-mail de contact | `guillaumelioni.pro@gmail.com` |
| Site web (facultatif mais recommandé) | `https://pilot-potager.vercel.app` |
| Classification du contenu | Questionnaire IARC — "Tout public" attendu (pas de contenu sensible) |
| Public cible et contenu | Sélectionner "Plus de 13 ans" si le compte/paiement est requis pour Premium |
| Annonce des achats intégrés | Cocher "Oui" — préciser "Abonnement Pilot Premium — 4,99 € / mois" |
| Sécurité des données (Data safety form) | Voir section ci-dessous — à déclarer précisément |

---

## 🛡️ Formulaire "Sécurité des données" (Data safety) — ce qu'il faut déclarer

D'après l'architecture actuelle de l'app (et la politique de confidentialité ci-jointe), déclarez :

**Données collectées et partagées :**
- *Informations personnelles* : adresse e-mail (création de compte — facultatif)
- *Photos* : envoyées à un service tiers (OpenAI) pour analyse IA, non conservées après traitement
- *Informations sur les achats* : statut d'abonnement (géré par Google Play / RevenueCat)
- *Position approximative* : ville renseignée manuellement pour la météo (facultatif, non liée à l'identité)

**Pratiques à cocher :**
- ✅ Les données sont chiffrées en transit (HTTPS/TLS)
- ✅ Vous proposez un moyen de demander la suppression des données (export + suppression de compte dans les Paramètres)
- ✅ La collecte de données est facultative pour les fonctions de base (l'app fonctionne sans compte)

**Finalité déclarée :** Fonctionnalité de l'app, Personnalisation, Analyse/diagnostic.

> ⚠️ Remplissez ce formulaire avec précision — Google vérifie la cohérence entre votre déclaration,
> votre politique de confidentialité et le comportement réel de l'app. La version actuelle
> (mode local par défaut + compte facultatif + IA via proxy sécurisé) facilite une déclaration
> simple et rassurante pour les utilisateurs.

---

## 📋 Check-list avant soumission

- [ ] Icône 512×512 et image de présentation 1024×500 importées
- [ ] 2 à 8 captures d'écran par type d'appareil (téléphone obligatoire, tablette recommandé)
- [ ] Politique de confidentialité publiée et accessible (`/privacy.html`)
- [ ] Formulaire "Sécurité des données" rempli
- [ ] Achats intégrés déclarés (abonnement Premium 4,99 €/mois)
- [ ] Classification du contenu (questionnaire IARC) complétée
- [ ] AAB signé généré et téléversé (`npx cap open android` → Build > Generate Signed Bundle)
- [ ] Test interne / fermé recommandé avant la diffusion publique
