# Assets Google Play — Pilot Potager

Ce dossier contient des gabarits HTML/CSS prêts à être exportés en images PNG
aux bonnes dimensions pour Google Play Console.

## ⚠️ Important
Je ne peux pas générer directement des fichiers image (PNG/JPG) — uniquement du
texte/code. Ces fichiers HTML sont donc des **gabarits visuels** que tu dois
"capturer" en image. C'est rapide (5 minutes) :

## Méthode recommandée (navigateur Chrome)
1. Ouvre le fichier `.html` dans Chrome (double-clic).
2. Appuie sur `F12` pour ouvrir les outils développeur.
3. Appuie sur `Ctrl+Shift+M` (mode responsive), puis clique sur les 3 points
   verticaux en haut à droite de la barre responsive → **"Capture de
   l'écran"** (ou "Capture screenshot"). Cela exporte un PNG aux dimensions
   exactes de la page.
4. Renomme le fichier obtenu selon l'usage (voir tableau ci-dessous).

## Fichiers et dimensions

| Fichier | Dimensions | Usage Play Console |
|---|---|---|
| `icon-512.html` | 512×512 | Icône de l'application (haute résolution) |
| `feature-graphic.html` | 1024×500 | Image graphique principale (bannière fiche store) |
| `screenshots/*.html` | 1080×1920 | Captures d'écran téléphone (portrait) |

## Pour les captures d'écran réelles de l'app
Les fichiers dans `screenshots/` sont des **mockups avec un cadre de
téléphone vide** + titre marketing. Pour un résultat optimal :
1. Lance l'app (`npm run dev` ou sur ton téléphone) et fais de vraies
   captures d'écran (Dashboard, Analyse IA, Assistant culture, Premium...).
2. Dans chaque fichier `screenshots/0X-*.html`, remplace le `<div
   class="placeholder">` par `<img src="chemin/vers/ta-capture.png" />`
   (la ligne en commentaire montre le format attendu).
3. Recapture la page avec la méthode ci-dessus → image finale 1080×1920
   prête pour Play Console (recommandé : 4 à 8 captures).

## Couleurs utilisées (cohérence avec l'app)
- Vert très foncé : `#0f3324` / `#16432f`
- Vert moyen : `#1f7a4d`
- Vert clair / accent : `#2fae6e`
- Texte blanc avec halos lumineux (glow radial blanc transparent)
