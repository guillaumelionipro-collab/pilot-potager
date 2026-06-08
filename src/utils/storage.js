import { seedCultures, seedHarvests, seedHistory, seedJournal, seedProblems, seedSeasons, seedSeedlings, seedStocks, seedTasks, seedZones } from "../data/seedData";

const STORE_PREFIX = "pilot-potager";

const seeds = {
  zones: seedZones,
  cultures: seedCultures,
  tasks: seedTasks,
  harvests: seedHarvests,
  journal: seedJournal,
  stocks: seedStocks,
  seasons: seedSeasons,
  history: seedHistory,
  seedlings: seedSeedlings,
  problems: seedProblems
};

export function loadCollection(name) {
  const key = `${STORE_PREFIX}:${name}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    localStorage.setItem(key, JSON.stringify(seeds[name] ?? []));
    return seeds[name] ?? [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return seeds[name] ?? [];
  }
}

export function saveCollection(name, value) {
  localStorage.setItem(`${STORE_PREFIX}:${name}`, JSON.stringify(value));
}

export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(date) {
  if (!date) return "Non planifié";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}
