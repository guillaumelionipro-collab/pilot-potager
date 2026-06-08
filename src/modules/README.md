# PILOT POTAGER modules

Ce dossier prépare le refactor progressif de l’application.

Prochaine découpe recommandée :

- `dashboard/` : météo, alertes, synthèse.
- `garden/` : zones, plan visuel, rotations.
- `cultures/` : cultures, fiches, timeline.
- `planning/` : calendrier, tâches, notifications.
- `assistant/` : assistant local et connecteur IA.
- `data/` : export, import, saisons, Supabase.

La V4 garde encore l’orchestration dans `App.jsx` pour éviter une régression pendant l’ajout massif de fonctionnalités.
