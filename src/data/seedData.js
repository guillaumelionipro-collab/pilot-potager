export const seedZones = [
  {
    id: "zone-1",
    name: "Carré aromates",
    type: "Carré potager",
    exposure: "Soleil du matin",
    size: "1,2 m2",
    notes: "Proche de la cuisine, sol très drainant.",
    cultures: ["Basilic Genovese", "Persil plat"]
  },
  {
    id: "zone-2",
    name: "Serre principale",
    type: "Serre",
    exposure: "Plein soleil",
    size: "6 m2",
    notes: "Ouvrir tôt les journées chaudes.",
    cultures: ["Tomate Noire de Crimée", "Poivron doux"]
  },
  {
    id: "zone-3",
    name: "Bacs terrasse",
    type: "Bac",
    exposure: "Mi-ombre",
    size: "240 L",
    notes: "Surveiller le dessèchement au vent.",
    cultures: ["Salade feuille de chêne", "Radis rond"]
  }
];

export const seedCultures = [
  {
    id: "culture-1",
    plant: "Tomate",
    variety: "Noire de Crimée",
    sowingDate: "2026-03-12",
    plantingDate: "2026-05-10",
    zone: "Serre principale",
    status: "bon",
    watering: "Tous les 2 jours",
    nextAction: "Tuteurer et retirer les gourmands",
    harvestDate: "2026-07-20",
    notes: "Deux bouquets floraux déjà visibles."
  },
  {
    id: "culture-2",
    plant: "Basilic",
    variety: "Genovese",
    sowingDate: "2026-04-05",
    plantingDate: "2026-05-18",
    zone: "Carré aromates",
    status: "à surveiller",
    watering: "Tous les jours par forte chaleur",
    nextAction: "Pincer les têtes",
    harvestDate: "2026-06-15",
    notes: "Feuilles un peu pâles après repiquage."
  },
  {
    id: "culture-3",
    plant: "Salade",
    variety: "Feuille de chêne",
    sowingDate: "2026-05-01",
    plantingDate: "2026-05-20",
    zone: "Bacs terrasse",
    status: "bon",
    watering: "Tous les 2 jours",
    nextAction: "Récolter les feuilles extérieures",
    harvestDate: "2026-06-10",
    notes: "Croissance régulière."
  }
];

export const seedTasks = [
  {
    id: "task-1",
    title: "Arroser la serre",
    priority: "haute",
    category: "arrosage",
    dueDate: "2026-05-30",
    zone: "Serre principale",
    culture: "Tomate Noire de Crimée",
    completed: false
  },
  {
    id: "task-2",
    title: "Semer une nouvelle ligne de radis",
    priority: "moyenne",
    category: "semis",
    dueDate: "2026-06-01",
    zone: "Bacs terrasse",
    culture: "Radis rond",
    completed: false
  },
  {
    id: "task-3",
    title: "Vérifier les pucerons sur aromates",
    priority: "basse",
    category: "traitement",
    dueDate: "2026-05-29",
    zone: "Carré aromates",
    culture: "Basilic Genovese",
    completed: false
  }
];

export const seedHarvests = [
  {
    id: "harvest-1",
    culture: "Radis rond",
    quantity: "350 g",
    date: "2026-05-24",
    zone: "Bacs terrasse",
    quality: "bonne",
    notes: "Récolte croquante, calibre régulier."
  },
  {
    id: "harvest-2",
    culture: "Menthe",
    quantity: "2 bouquets",
    date: "2026-05-27",
    zone: "Carré aromates",
    quality: "excellente",
    notes: "Parfaite pour infusion et cuisine."
  }
];

export const seedJournal = [
  {
    id: "journal-1",
    date: "2026-05-28",
    culture: "Tomate Noire de Crimée",
    zone: "Serre principale",
    note: "Bonne reprise après plantation, fleurs visibles.",
    photo: "",
    observation: "Vigoureux",
    issue: "Aucun"
  }
];

export const seedStocks = [
  {
    id: "stock-1",
    name: "Graines de radis",
    category: "graines",
    quantity: "1 sachet",
    threshold: "1 sachet",
    notes: "À renouveler avant les semis d'été."
  },
  {
    id: "stock-2",
    name: "Savon noir",
    category: "traitement",
    quantity: "500 ml",
    threshold: "200 ml",
    notes: "Pour pucerons, à utiliser le soir."
  },
  {
    id: "stock-3",
    name: "Tuteurs bambou",
    category: "support",
    quantity: "12",
    threshold: "6",
    notes: "Réservés tomates et poivrons."
  }
];

export const seedSeasons = [
  {
    id: "season-2026",
    name: "Saison 2026",
    year: "2026",
    status: "active",
    notes: "Première saison suivie dans PILOT POTAGER."
  }
];

export const seedHistory = [
  {
    id: "history-1",
    date: "2026-05-30",
    type: "initialisation",
    label: "Création de la première saison PILOT POTAGER"
  }
];

export const seedSeedlings = [
  {
    id: "seedling-1",
    plant: "Tomate",
    variety: "Noire de Crimée",
    sowingDate: "2026-03-12",
    expectedGermination: "2026-03-22",
    transplantDate: "2026-05-10",
    successRate: "80",
    tray: "Mini-serre 1",
    notes: "Levée régulière, plants trapus."
  }
];

export const seedProblems = [
  {
    id: "problem-1",
    date: "2026-05-28",
    culture: "Basilic Genovese",
    symptom: "Feuilles pâles",
    suspectedCause: "Stress de repiquage",
    action: "Arrosage léger et observation",
    followUpDate: "2026-06-04",
    result: "À suivre"
  }
];
