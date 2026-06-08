// Gamification system — jardinier levels & badges, computed from app activity.
// Pure functions: given the user's collections, return level + unlocked badges.
// No backend required; everything derives from data already stored locally
// (cultures, journal, harvests, tasks, history, AI analyses).

export const LEVELS = [
  { key: "debutant",  label: "Débutant",        emoji: "🌱", minPoints: 0 },
  { key: "apprenti",  label: "Apprenti",        emoji: "🌿", minPoints: 40 },
  { key: "passionne", label: "Passionné",       emoji: "🍅", minPoints: 120 },
  { key: "expert",    label: "Expert",          emoji: "🌻", minPoints: 280 },
  { key: "maitre",    label: "Maître Jardinier", emoji: "🏆", minPoints: 500 },
];

export const BADGES = [
  { key: "first_planting", emoji: "🌱", title: "Première plantation",  test: (s) => s.cultures >= 1 },
  { key: "photos_50",      emoji: "📷", title: "50 photos",            test: (s) => s.photos >= 50 },
  { key: "first_harvest",  emoji: "🍅", title: "Première récolte",     test: (s) => s.harvests >= 1 },
  { key: "tasks_100",      emoji: "🏆", title: "100 tâches réalisées", test: (s) => s.tasksDone >= 100 },
  { key: "ai_explorer",    emoji: "🤖", title: "Explorateur IA",       test: (s) => s.aiAnalyses >= 5 },
  { key: "five_cultures",  emoji: "🌾", title: "Petite ferme (5 cultures)", test: (s) => s.cultures >= 5 },
  { key: "streak_7",       emoji: "🔥", title: "7 jours de suivi",     test: (s) => s.followUpDays >= 7 },
  { key: "zone_master",    emoji: "🏡", title: "3 zones aménagées",    test: (s) => s.zones >= 3 },
];

// Points formula — simple & transparent so users understand how to progress.
export function computePoints(stats) {
  return (
    stats.cultures * 8 +
    stats.tasksDone * 2 +
    stats.harvests * 10 +
    stats.photos * 1.5 +
    stats.aiAnalyses * 4 +
    stats.zones * 6 +
    Math.min(stats.followUpDays, 60) * 1.5
  ) | 0;
}

export function levelForPoints(points) {
  let current = LEVELS[0];
  let next = LEVELS[1] || null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].minPoints) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }
  const progress = next ? Math.min(100, Math.round(((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100)) : 100;
  return { current, next, progress, points };
}

/**
 * Builds a stats summary from the app's stored collections, suitable for both
 * points computation and badge tests.
 */
export function buildActivityStats({ cultures = [], tasks = [], harvests = [], journal = [], zones = [], history = [], aiAnalyses = 0 }) {
  const tasksDone = tasks.filter((t) => t.completed).length;
  const followUpDays = new Set(history.map((h) => h.date)).size;
  return {
    cultures: cultures.length,
    tasksDone,
    harvests: harvests.length,
    photos: journal.length,
    zones: zones.length,
    aiAnalyses,
    followUpDays,
  };
}

export function unlockedBadges(stats) {
  return BADGES.map((b) => ({ ...b, unlocked: b.test(stats) }));
}
