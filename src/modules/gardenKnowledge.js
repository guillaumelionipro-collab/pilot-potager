export const vegetableWikiPages = {
  Tomate: "Tomate",
  Concombre: "Concombre",
  Salade: "Laitue cultivée",
  "Melon charentais": "Melon charentais",
  Aubergine: "Aubergine",
  Poivron: "Poivron",
  Courgette: "Courgette",
  Fraise: "Fraise",
  Basilic: "Basilic (plante)",
  Persil: "Persil",
  Menthe: "Menthe",
  Carotte: "Carotte",
  Radis: "Radis",
  Haricot: "Haricot vert",
  "Pomme de terre": "Pomme de terre"
};

export const cropFamilies = {
  Tomate: "Solanacées",
  Aubergine: "Solanacées",
  Poivron: "Solanacées",
  "Pomme de terre": "Solanacées",
  Concombre: "Cucurbitacées",
  Courgette: "Cucurbitacées",
  "Melon charentais": "Cucurbitacées",
  Potimarron: "Cucurbitacées",
  Butternut: "Cucurbitacées",
  Salade: "Astéracées",
  Carotte: "Apiacées",
  Panais: "Apiacées",
  Céleri: "Apiacées",
  Persil: "Apiacées",
  Radis: "Brassicacées",
  Chou: "Brassicacées",
  Brocoli: "Brassicacées",
  "Chou kale": "Brassicacées",
  Navet: "Brassicacées",
  Haricot: "Fabacées",
  Pois: "Fabacées",
  Fève: "Fabacées",
  Fraise: "Rosacées",
  Framboise: "Rosacées",
  Basilic: "Lamiacées",
  Menthe: "Lamiacées",
  Thym: "Lamiacées",
  Romarin: "Lamiacées",
  Sauge: "Lamiacées",
  Ail: "Alliacées",
  Oignon: "Alliacées",
  Échalote: "Alliacées",
  Poireau: "Alliacées"
};

export const companionPlants = {
  Tomate: { good: ["Basilic", "Salade", "Carotte"], avoid: ["Pomme de terre"] },
  Salade: { good: ["Radis", "Carotte", "Fraise"], avoid: ["Persil"] },
  Courgette: { good: ["Haricot", "Maïs", "Capucine"], avoid: ["Pomme de terre"] },
  Concombre: { good: ["Haricot", "Salade"], avoid: ["Pomme de terre"] },
  Carotte: { good: ["Poireau", "Oignon", "Salade"], avoid: ["Aneth"] },
  Haricot: { good: ["Courgette", "Carotte"], avoid: ["Ail", "Oignon"] },
  Fraise: { good: ["Ail", "Bourrache", "Salade"], avoid: ["Chou"] },
  Chou: { good: ["Menthe", "Céleri", "Souci"], avoid: ["Fraise"] }
};

const cropEnhancements = {
  Tomate: {
    varieties: ["Noire de Crimée", "Cœur de bœuf", "Marmande", "Green Zebra"],
    compatible: ["Serre", "Pleine terre", "Bac"],
    hydro: "Possible en hydroponie avec support et nutrition suivie.",
    months: [2, 3, 4, 5, 6, 7, 8, 9]
  },
  Salade: {
    varieties: ["Feuille de chêne", "Batavia", "Romaine", "Sucrine"],
    compatible: ["Carré potager", "Pots", "Bac", "Hydroponie", "NFT"],
    hydro: "Très adaptée à l’hydroponie et au NFT.",
    months: [2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  Basilic: {
    varieties: ["Genovese", "Citron", "Thaï", "Pourpre"],
    compatible: ["Pots", "Bac", "Serre", "Hydroponie"],
    hydro: "Très bon candidat hydroponique.",
    months: [3, 4, 5, 6, 7, 8, 9]
  },
  Fraise: {
    varieties: ["Gariguette", "Mara des bois", "Charlotte", "Ciflorette"],
    compatible: ["Pleine terre", "Bac", "Pots", "Hydroponie"],
    hydro: "Possible en gouttière ou tour hydroponique.",
    months: [2, 3, 4, 5, 6, 7, 8]
  },
  Courgette: {
    varieties: ["Verte non coureuse", "Ronde de Nice", "Gold Rush"],
    compatible: ["Pleine terre", "Grand bac"],
    hydro: "Possible mais volumineuse, prévoir beaucoup d’espace.",
    months: [3, 4, 5, 6, 7, 8, 9]
  },
  "Œillet d’Inde": {
    varieties: ["Nain simple", "Nématicide", "Orange flamme"],
    compatible: ["Bordures", "Pots", "Carré potager"],
    hydro: "Peu pertinent en hydroponie.",
    months: [2, 3, 4, 5, 6, 7, 8, 9]
  }
};

export function inferCardType(name) {
  if (["Fraise", "Framboise", "Groseille", "Cassis", "Myrtille", "Rhubarbe", "Raisin", "Kiwi", "Figuier", "Pommier", "Poirier"].includes(name)) return "Fruit";
  if (["Basilic", "Persil", "Menthe", "Thym", "Romarin", "Sauge", "Ciboulette", "Coriandre", "Aneth", "Estragon", "Origan", "Laurier"].includes(name)) return "Aromate";
  if (["Œillet d’Inde", "Capucine", "Bourrache", "Souci", "Lavande", "Cosmos", "Tournesol", "Phacélie", "Nigelle", "Camomille"].includes(name)) return "Fleur utile";
  return "Légume";
}

export function getCropEnhancement(name) {
  return cropEnhancements[name] ?? {
    varieties: ["Classique", "Précoce", "Rustique"],
    compatible: ["Pleine terre", "Carré potager", "Bac"],
    hydro: "À tester selon volume racinaire et besoins en eau.",
    months: [2, 3, 4, 5, 6, 7, 8]
  };
}

export const monthLabels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
