import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpenCheck,
  ClipboardList,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Crown,
  Droplets,
  Download,
  Edit3,
  FileJson,
  FlaskConical,
  Grid3X3,
  Leaf,
  Loader,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  ShieldAlert,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings,
  ShoppingCart,
  Sprout,
  Trash2,
  TrendingUp,
  Upload,
  Wheat,
  X
} from "lucide-react";
import { vegetableCards } from "./data/vegetables";
import { Badge, Button, Card, EmptyState, Field, Modal, inputClass } from "./components/ui.jsx";
import AuthGate from "./components/potager/AuthGate";
import PhotoAnalysis from "./components/potager/PhotoAnalysis";
import CultureLibrary from "./components/potager/CultureLibrary";
import MyPlants from "./components/potager/MyPlants";
import PremiumPage from "./components/potager/PremiumPage";
import Statistics from "./components/potager/Statistics";
import SettingsPage from "./components/potager/SettingsPage";
import TodayInGarden from "./components/potager/TodayInGarden";
import GardenerProgress from "./components/potager/GardenerProgress";
import { formatDate, loadCollection, makeId, saveCollection, todayIso } from "./utils/storage";
import { fetchWeather, gardenAdvice, weatherLabel } from "./utils/weather";
import { askRemoteAssistant } from "./utils/aiAssistant";
import { syncToSupabase, isAuthConfigured, getSession, onAuthStateChange, signOut } from "./utils/supabaseClient";
import { buildNotifications } from "./utils/notifications";
import { loginRevenueCat } from "./utils/billing";
import { companionPlants, cropFamilies, getCropEnhancement, inferCardType, monthLabels, vegetableWikiPages } from "./modules/gardenKnowledge";

const navGroups = [
  { label: "Tableau de bord", items: [
    ["Dashboard",      BarChart3],
    ["Mes Plantes",    Sprout],
    ["Cette semaine",  ClipboardList],
  ]},
  { label: "Culture", items: [
    ["Mon potager",    Leaf],
    ["Mes cultures",   Wheat],
    ["Tâches",         CheckCircle2],
    ["Récoltes",       Droplets],
    ["Journal photo",  Camera],
  ]},
  { label: "Diagnostic & IA", items: [
    ["Analyse IA",     Camera],
    ["Diagnostic",     FlaskConical],
    ["Problèmes",      ShieldAlert],
    ["Assistant potager", MessageCircle],
  ]},
  { label: "Planification", items: [
    ["Calendrier",     CalendarDays],
    ["Semis",          BookOpenCheck],
    ["Timeline",       Route],
    ["Saisons",        FileJson],
  ]},
  { label: "Bibliothèque", items: [
    ["Bibliothèque cultures", BookOpenCheck],
    ["Fiches légumes", Wheat],
  ]},
  { label: "Outils", items: [
    ["Plan visuel",    Grid3X3],
    ["Stocks",         Package],
    ["Statistiques", TrendingUp],
  ]},
  { label: "Compte", items: [
    ["Pilot Premium",  Crown],
    ["Paramètres",     Settings],
  ]},
];

// Flat list kept for legacy search targets
const navItems = navGroups.flatMap((g) => g.items);

const PAGE_META = {
  "Dashboard":             { emoji: "🌿", subtitle: "Vue d'ensemble de votre potager" },
  "Mes Plantes":           { emoji: "🌱", subtitle: "Suivi individuel de vos 9 plantes" },
  "Cette semaine":         { emoji: "📋", subtitle: "Actions prioritaires de la semaine" },
  "Mon potager":           { emoji: "🏡", subtitle: "Zones et espaces de culture" },
  "Mes cultures":          { emoji: "🌿", subtitle: "Toutes vos cultures en cours" },
  "Tâches":                { emoji: "✅", subtitle: "Vos tâches et rappels" },
  "Récoltes":              { emoji: "🌾", subtitle: "Historique et suivi des récoltes" },
  "Journal photo":         { emoji: "📷", subtitle: "Journal photographique de votre jardin" },
  "Analyse IA":            { emoji: "🤖", subtitle: "Diagnostic de plante par photo" },
  "Diagnostic":            { emoji: "🔬", subtitle: "Identifier les maladies et carences" },
  "Problèmes":             { emoji: "⚠️",  subtitle: "Suivi des problèmes et traitements" },
  "Assistant potager":     { emoji: "💬", subtitle: "Conseils personnalisés par IA" },
  "Calendrier":            { emoji: "📅", subtitle: "Planification des semis et récoltes" },
  "Semis":                 { emoji: "🌱", subtitle: "Gestion de vos plateaux de semis" },
  "Timeline":              { emoji: "📈", subtitle: "Chronologie de votre jardin" },
  "Saisons":               { emoji: "🍂", subtitle: "Gestion des saisons de culture" },
  "Bibliothèque cultures": { emoji: "📚", subtitle: "73 cultures · légumes, fruits, aromatiques" },
  "Fiches légumes":        { emoji: "🥦", subtitle: "Fiches pratiques par légume" },
  "Plan visuel":           { emoji: "🗺️",  subtitle: "Vue cartographique du potager" },
  "Stocks":                { emoji: "📦", subtitle: "Inventaire des semences et fournitures" },
  "Statistiques":      { emoji: "📊", subtitle: "Analyse de vos performances au potager" },
  "Pilot Premium":         { emoji: "⭐", subtitle: "Débloquez toutes les fonctionnalités" },
  "Paramètres":            { emoji: "⚙️", subtitle: "Compte, abonnement, confidentialité et données" },
};

const zoneTypes = ["Carré potager", "Pleine terre", "Serre", "Pots", "Bac", "Hydroponie", "NFT", "Seau hydroponique"];
const statuses = ["bon", "à surveiller", "malade", "terminé"];
const priorities = ["basse", "moyenne", "haute"];
const taskCategories = ["arrosage", "semis", "plantation", "taille", "traitement", "récolte", "entretien"];

const statusTone = {
  bon: "green",
  "à surveiller": "amber",
  malade: "red",
  terminé: "gray"
};

const priorityTone = {
  basse: "green",
  moyenne: "amber",
  haute: "red"
};

const autoTaskTemplates = [
  { match: "tomate", title: "Vérifier les tuteurs des tomates", category: "entretien", priority: "moyenne", offset: 2 },
  { match: "tomate", title: "Surveiller le mildiou", category: "traitement", priority: "haute", offset: 5 },
  { match: "salade", title: "Arroser les salades sans excès", category: "arrosage", priority: "moyenne", offset: 1 },
  { match: "basilic", title: "Pincer le basilic", category: "taille", priority: "basse", offset: 4 },
  { match: "courgette", title: "Récolter les jeunes courgettes", category: "récolte", priority: "moyenne", offset: 3 }
];

const diagnosticRules = {
  "Feuilles jaunes": "Vérifiez l'excès d'eau, le manque d'azote, le stress de repiquage et le drainage. Arrosez seulement si le sol est sec en profondeur.",
  "Taches brunes": "Isolez les feuilles atteintes, évitez de mouiller le feuillage et aérez mieux. Sur tomates et pommes de terre, surveillez le mildiou.",
  "Trous dans les feuilles": "Cherchez limaces, altises ou chenilles. Inspectez le soir, paillez proprement et protégez les jeunes plants avec un voile si besoin.",
  "Plante flétrie": "Contrôlez l'humidité, la chaleur, les racines et un éventuel stress de transplantation. Ombrez temporairement si la chaleur est forte.",
  "Pucerons": "Jet d'eau doux, observation des auxiliaires, puis savon noir dilué le soir si la colonie progresse.",
  "Croissance lente": "Vérifiez température du sol, lumière, faim d'azote et concurrence. Un apport de compost mûr peut aider."
};

const seasonalAdvice = {
  0: "Janvier : planifier les rotations, nettoyer les outils, commander les graines.",
  1: "Février : premiers semis au chaud de tomates, poivrons et aubergines.",
  2: "Mars : semis de carottes, radis, salades et préparation des planches.",
  3: "Avril : repiquages progressifs, semis de haricots sous climat doux.",
  4: "Mai : plantations d'été après les gelées, paillage et premiers tuteurages.",
  5: "Juin : arrosage régulier, surveillance pucerons et récoltes de salades.",
  6: "Juillet : récoltes, paillage renforcé, ombrage des jeunes salades.",
  7: "Août : semis d'automne, surveillance sécheresse et récoltes abondantes.",
  8: "Septembre : dernières récoltes d'été, salades et radis d'automne.",
  9: "Octobre : nettoyage, compost, plantations d'ail et protection du sol.",
  10: "Novembre : paillage d'hiver, rangement des tuteurs, bilan de saison.",
  11: "Décembre : repos du sol, plan de culture et choix des variétés."
};

function daysFromNow(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function parseQuantity(value = "") {
  const normalized = String(value).replace(",", ".").toLowerCase();
  const number = Number.parseFloat(normalized);
  if (Number.isNaN(number)) return 0;
  if (normalized.includes("kg")) return number * 1000;
  if (normalized.includes("g")) return number;
  return number;
}

function harvestCountdown(harvestDate) {
  if (!harvestDate) return { label: "Récolte non planifiée", tone: "gray" };
  const today = new Date(todayIso());
  const target = new Date(harvestDate);
  const days = Math.ceil((target - today) / 86400000);
  if (days < 0) return { label: `À vérifier depuis ${Math.abs(days)} j`, tone: "red" };
  if (days === 0) return { label: "Récolte possible aujourd’hui", tone: "green" };
  if (days <= 7) return { label: `Dans ${days} j`, tone: "green" };
  if (days <= 21) return { label: `Dans ${days} j`, tone: "amber" };
  return { label: `Dans ${days} j`, tone: "blue" };
}

function wateringAdviceFor(culture, zones, weather) {
  const zone = zones.find((item) => item.name === culture.zone);
  const type = zone?.type?.toLowerCase() || "";
  let score = 2;
  const reasons = [];
  if (type.includes("pot") || type.includes("bac")) {
    score += 2;
    reasons.push("culture en contenant");
  }
  if (type.includes("serre")) {
    score += 1;
    reasons.push("serre plus sèche");
  }
  if (["Tomate", "Courgette", "Concombre", "Salade", "Basilic"].some((name) => culture.plant.includes(name))) {
    score += 1;
    reasons.push("culture sensible au stress hydrique");
  }
  if (weather?.temperature >= 28) {
    score += 2;
    reasons.push("chaleur");
  }
  if (weather?.rain >= 4 && !type.includes("serre")) {
    score -= 2;
    reasons.push("pluie prévue");
  }
  if (score >= 5) return { label: "Arroser aujourd’hui", tone: "red", reasons };
  if (score >= 3) return { label: "Vérifier l’humidité", tone: "amber", reasons };
  return { label: "Arrosage faible priorité", tone: "green", reasons };
}

function requestGardenNotifications(tasks, cultures) {
  if (!("Notification" in window)) return Promise.resolve("Notifications non supportées par ce navigateur.");
  return Notification.requestPermission().then((permission) => {
    if (permission !== "granted") return "Notifications refusées pour le moment.";
    const urgent = tasks.find((task) => !task.completed && task.dueDate <= todayIso());
    const harvest = cultures.find((culture) => culture.harvestDate && culture.harvestDate <= daysFromNow(7));
    new Notification("PILOT POTAGER", {
      body: urgent ? `À faire : ${urgent.title}` : harvest ? `Récolte proche : ${harvest.plant}` : "Tout est calme au potager aujourd'hui.",
      icon: "/icon.svg"
    });
    return "Notifications activées. Un rappel test vient d'être envoyé.";
  });
}

function useStoredCollection(name) {
  const [items, setItems] = useState(() => loadCollection(name));

  useEffect(() => {
    saveCollection(name, items);
  }, [name, items]);

  return [items, setItems];
}

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [zones, setZones] = useStoredCollection("zones");
  const [cultures, setCultures] = useStoredCollection("cultures");
  const [tasks, setTasks] = useStoredCollection("tasks");
  const [harvests, setHarvests] = useStoredCollection("harvests");
  const [journal, setJournal] = useStoredCollection("journal");
  const [stocks, setStocks] = useStoredCollection("stocks");
  const [seasons, setSeasons] = useStoredCollection("seasons");
  const [history, setHistory] = useStoredCollection("history");
  const [seedlings, setSeedlings] = useStoredCollection("seedlings");
  const [problems, setProblems] = useStoredCollection("problems");
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [weatherCity, setWeatherCity] = useState(() => localStorage.getItem("pilot-potager:weather-city") || "Paris");
  const [weather, setWeather] = useState(null);
  const [weatherState, setWeatherState] = useState("loading");
  const [globalQuery, setGlobalQuery] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [taskDraft, setTaskDraft] = useState(null);
  const [cultureDraft, setCultureDraft] = useState(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const authConfigured = isAuthConfigured();
  const [authReady, setAuthReady] = useState(!authConfigured);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!authConfigured) return;
    let ignored = false;
    getSession().then((s) => {
      if (ignored) return;
      setSession(s);
      setAuthReady(true);
      if (s?.user?.id) loginRevenueCat(s.user.id);
    });
    const unsubscribe = onAuthStateChange((s) => {
      setSession(s);
      setAuthReady(true);
      if (s?.user?.id) loginRevenueCat(s.user.id);
    });
    return () => { ignored = true; unsubscribe(); };
  }, [authConfigured]);

  const handleAuthenticated = (newSession) => {
    setSession(newSession);
  };

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
  };

  const today = todayIso();
  const overdueTasks = tasks.filter((task) => !task.completed && task.dueDate < today);
  const todayTasks = tasks.filter((task) => !task.completed && task.dueDate === today);
  const upcomingHarvests = [...cultures].filter((culture) => culture.harvestDate).sort((a, b) => a.harvestDate.localeCompare(b.harvestDate)).slice(0, 4);
  const watchedCultures = cultures.filter((culture) => ["à surveiller", "malade"].includes(culture.status));
  const activeSeason = seasons.find((season) => season.status === "active") ?? seasons[0];
  const searchResults = useMemo(() => {
    const query = globalQuery.trim().toLowerCase();
    if (!query) return [];
    const pool = [
      ...cultures.map((item) => ({ type: "Culture", label: `${item.plant} ${item.variety}`, detail: item.zone, target: "Mes cultures" })),
      ...tasks.map((item) => ({ type: "Tâche", label: item.title, detail: `${item.category} · ${item.zone}`, target: "Tâches" })),
      ...zones.map((item) => ({ type: "Zone", label: item.name, detail: item.type, target: "Mon potager" })),
      ...harvests.map((item) => ({ type: "Récolte", label: item.culture, detail: `${item.quantity} · ${formatDate(item.date)}`, target: "Récoltes" })),
      ...journal.map((item) => ({ type: "Journal", label: item.culture, detail: item.note, target: "Journal photo" })),
      ...stocks.map((item) => ({ type: "Stock", label: item.name, detail: item.category, target: "Stocks" })),
      ...seedlings.map((item) => ({ type: "Semis", label: `${item.plant} ${item.variety}`, detail: item.tray, target: "Semis" })),
      ...problems.map((item) => ({ type: "Problème", label: item.culture, detail: item.symptom, target: "Problèmes" })),
      ...vegetableCards.map((item) => ({ type: "Fiche", label: item.name, detail: item.difficulty, target: "Fiches légumes" }))
    ];
    return pool.filter((item) => `${item.type} ${item.label} ${item.detail}`.toLowerCase().includes(query)).slice(0, 8);
  }, [globalQuery, cultures, tasks, zones, harvests, journal, stocks, seedlings, problems]);

  useEffect(() => {
    let ignored = false;
    setWeatherState("loading");
    localStorage.setItem("pilot-potager:weather-city", weatherCity);
    fetchWeather(weatherCity)
      .then((data) => {
        if (!ignored) {
          setWeather(data);
          setWeatherState("ready");
        }
      })
      .catch(() => {
        if (!ignored) {
          setWeather(null);
          setWeatherState("error");
        }
      });
    return () => {
      ignored = true;
    };
  }, [weatherCity]);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const recordHistory = (type, label) => {
    setHistory((items) => [{ id: makeId("history"), date: todayIso(), type, label }, ...items].slice(0, 80));
  };

  const openModal = (type, item = null) => {
    setEditing(item ? { type, item } : null);
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
    setTaskDraft(null);
    setCultureDraft(null);
  };

  const openTaskForDate = (date) => {
    setTaskDraft({ dueDate: date });
    openModal("task");
  };

  const openCultureFromCard = (card) => {
    setCultureDraft({
      plant: card.name,
      watering: card.water,
      nextAction: `Surveiller : ${card.diseases}`,
      notes: `Type : ${card.type || inferCardType(card.name)}. Sol : ${card.soil}. Espacement : ${card.spacing}. Conseil : ${card.tips}`
    });
    openModal("culture");
  };

  const enableNotifications = () => {
    requestGardenNotifications(tasks, cultures).then(setNotificationMessage);
  };

  const context = {
    zones,
    cultures,
    tasks,
    harvests,
    journal,
    stocks,
    seasons,
    history,
    seedlings,
    problems,
    activeSeason,
    setZones,
    setCultures,
    setTasks,
    setHarvests,
    setJournal,
    setStocks,
    setSeasons,
    setHistory,
    setSeedlings,
    setProblems,
    recordHistory,
    openModal,
    openTaskForDate,
    openCultureFromCard,
    setModal,
    today,
    overdueTasks,
    todayTasks,
    upcomingHarvests,
    watchedCultures
  };

  const pageMeta = PAGE_META[active] || { emoji: "🌿", subtitle: "" };
  const activeGroup = navGroups.find((g) => g.items.some(([item]) => item === active));

  // ── Authentication gate ──────────────────────────────────────────────────
  // Shown only when Supabase Auth is configured (VITE_SUPABASE_URL/ANON_KEY)
  // and the user hasn't chosen "continue without an account". This keeps the
  // app fully usable offline-first while enabling cloud backup, multi-device
  // sync and a reliable link between Google Play purchases and a profile.
  if (authConfigured && !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-garden-paper text-garden-pine">
        <Loader size={28} className="animate-spin" />
      </div>
    );
  }
  if (authConfigured && !session) {
    return <AuthGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen text-garden-pine">

      {/* ── SIDEBAR desktop ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col lg:flex border-r border-garden-moss/60 bg-garden-paper/95 backdrop-blur-md shadow-soft">
        {/* Logo */}
        <div className="shrink-0 px-5 py-6 border-b border-garden-moss/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-garden-pine text-white shadow-card">
              <Leaf size={22} />
            </div>
            <div>
              <p className="text-base font-black tracking-wide text-garden-pine">PILOT POTAGER</p>
              <p className="text-xs text-garden-sage font-semibold">Carnet de culture intelligent</p>
            </div>
          </div>
        </div>

        {/* Nav grouped */}
        <nav className="soft-scroll flex-1 overflow-y-auto px-3 py-4 grid content-start gap-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-garden-sage/70">{group.label}</p>
              <div className="grid gap-0.5">
                {group.items.map(([item, Icon]) => (
                  <button key={item} onClick={() => setActive(item)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                      active === item
                        ? "bg-garden-pine text-white shadow-card"
                        : "text-garden-leaf hover:bg-garden-moss/50 hover:text-garden-pine"
                    }`}>
                    <Icon size={16} className="flex-shrink-0" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom status bar */}
        <div className="shrink-0 px-5 py-4 border-t border-garden-moss/50">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-xs font-bold text-garden-sage">{isOnline ? "Connecté" : "Hors ligne"}</span>
            {activeSeason && <span className="ml-auto text-xs font-bold text-garden-leaf truncate">{activeSeason.name}</span>}
          </div>
        </div>
      </aside>

      {/* ── BOTTOM NAV mobile ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-garden-moss/60 bg-garden-paper/95 backdrop-blur-md lg:hidden">
        {navGroups.slice(0, 4).map((group) => {
          const [item, Icon] = group.items[0];
          return (
            <button key={item} onClick={() => setActive(item)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 px-1 text-[10px] font-bold transition ${
                activeGroup?.label === group.label ? "text-garden-pine" : "text-garden-sage"
              }`}>
              <Icon size={20} className={activeGroup?.label === group.label ? "text-garden-pine" : "text-garden-sage"} />
              <span className="truncate max-w-full px-1">{group.label.split(" ")[0]}</span>
            </button>
          );
        })}
        <button onClick={() => setMobileMenuOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 px-1 py-3 text-[10px] font-bold text-garden-sage transition">
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-garden-pine/35 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-garden-paper p-4 pb-8 shadow-soft" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-garden-paper py-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-garden-sage">PILOT POTAGER</p>
                <h2 className="text-xl font-black">Navigation</h2>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-garden-moss text-garden-pine" aria-label="Fermer le menu">
                <X size={20} />
              </button>
            </div>
            <div className="relative mb-5">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-sage" />
              <input className={`${inputClass} w-full pl-9`} value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} placeholder="Rechercher dans l’application…" />
            </div>
            <div className="grid gap-5">
              {navGroups.map((group) => (
                <section key={group.label}>
                  <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.15em] text-garden-sage">{group.label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map(([item, Icon]) => (
                      <button key={item} onClick={() => { setActive(item); setMobileMenuOpen(false); }}
                        className={`flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold ${active === item ? "bg-garden-pine text-white" : "bg-white text-garden-leaf"}`}>
                        <Icon size={17} className="shrink-0" />
                        <span className="min-w-0 break-words">{item}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="lg:ml-72 min-h-screen">

        {/* Contextual header */}
        <header className="sticky top-0 z-30 border-b border-garden-moss/50 bg-garden-paper/90 backdrop-blur-md px-5 py-4 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Breadcrumb + title */}
            <div className="flex-1 min-w-0">
              {activeGroup && (
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-garden-sage mb-0.5">
                  {activeGroup.label}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">{pageMeta.emoji}</span>
                <h1 className="text-base sm:text-lg font-black text-garden-pine leading-tight">{active}</h1>
              </div>
              {pageMeta.subtitle && (
                <p className="text-xs text-garden-leaf mt-0.5 hidden sm:block">{pageMeta.subtitle}</p>
              )}
            </div>

            {/* Global search */}
            <div className="relative hidden md:block w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-sage" />
              <input className="w-full pl-8 pr-3 py-2 rounded-xl border border-garden-moss bg-white/80 text-sm text-garden-pine placeholder:text-garden-sage focus:outline-none focus:ring-2 focus:ring-garden-leaf"
                value={globalQuery} onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Recherche…" />
              {searchResults.length > 0 && (
                <div className="absolute z-50 mt-2 w-80 right-0 grid gap-1 rounded-2xl border border-garden-moss bg-garden-paper p-2 shadow-soft">
                  {searchResults.map((result, index) => (
                    <button key={`${result.type}-${result.label}-${index}`}
                      className="rounded-xl px-3 py-2 text-left hover:bg-garden-moss/60 transition"
                      onClick={() => { setActive(result.target); setGlobalQuery(""); }}>
                      <span className="text-[10px] font-black uppercase text-garden-leaf">{result.type}</span>
                      <span className="block text-sm font-bold text-garden-pine">{result.label}</span>
                      <span className="block text-xs text-garden-sage">{result.detail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action CTA */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <QuickActions openModal={openModal} />
              <NotificationBell tasks={tasks} cultures={cultures} journal={journal} problems={problems}
                onSelect={(target) => setActive(target)} onEnableNative={enableNotifications} />
            </div>
          </div>
          {notificationMessage && (
            <p className="max-w-7xl mx-auto mt-2 rounded-xl bg-garden-moss px-3 py-1.5 text-sm font-semibold text-garden-pine">{notificationMessage}</p>
          )}
        </header>

        {/* Page content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">

          {active === "Dashboard" && <Dashboard {...context} tasks={tasks} problems={problems} zones={zones} journal={journal} weather={weather} weatherCity={weatherCity} setWeatherCity={setWeatherCity} weatherState={weatherState} />}
          {active === "Mes Plantes" && <MyPlants />}
          {active === "Cette semaine" && <WeekFocus {...context} weather={weather} />}
          {active === "Mon potager" && <GardenZones {...context} openModal={openModal} />}
          {active === "Mes cultures" && <Cultures {...context} openModal={openModal} />}
          {active === "Calendrier" && <CalendarView tasks={tasks} cultures={cultures} openTaskForDate={openTaskForDate} />}
          {active === "Fiches légumes" && <VegetableLibrary openCultureFromCard={openCultureFromCard} />}
          {active === "Tâches" && <Tasks {...context} openModal={openModal} />}
          {active === "Journal photo" && <PhotoJournal {...context} openModal={openModal} />}
          {active === "Assistant potager" && <GardenAssistant {...context} weather={weather} />}
          {active === "Récoltes" && <Harvests {...context} openModal={openModal} />}
          {active === "Timeline" && <CultureTimeline cultures={cultures} tasks={tasks} harvests={harvests} journal={journal} seedlings={seedlings} problems={problems} />}
          {active === "Plan visuel" && <GardenPlan zones={zones} cultures={cultures} setCultures={setCultures} recordHistory={recordHistory} />}
          {active === "Diagnostic" && <DiagnosticCenter cultures={cultures} />}
          {active === "Semis" && <SeedlingsManager seedlings={seedlings} setSeedlings={setSeedlings} recordHistory={recordHistory} />}
          {active === "Problèmes" && <ProblemsLog problems={problems} setProblems={setProblems} cultures={cultures} recordHistory={recordHistory} />}
          {active === "Stocks" && <StockManager stocks={stocks} setStocks={setStocks} />}
          {active === "Saisons" && <SeasonTools {...context} />}
          {active === "Analyse IA" && <PhotoAnalysis />}
          {active === "Bibliothèque cultures" && <CultureLibrary />}
          {active === "Statistiques" && <Statistics cultures={cultures} harvests={harvests} tasks={tasks} journal={journal} history={history} />}
          {active === "Pilot Premium" && <PremiumPage />}
          {active === "Paramètres" && <SettingsPage user={session?.user || null} authConfigured={authConfigured} onSignOut={handleSignOut} />}
        </div>
      </main>

      {modal === "zone" && <ZoneModal zones={zones} setZones={setZones} editing={editing?.type === "zone" ? editing.item : null} recordHistory={recordHistory} onClose={closeModal} />}
      {modal === "culture" && <CultureModal zones={zones} cultures={cultures} setCultures={setCultures} editing={editing?.type === "culture" ? editing.item : null} draft={cultureDraft} activeSeason={activeSeason} recordHistory={recordHistory} onClose={closeModal} />}
      {modal === "task" && <TaskModal zones={zones} cultures={cultures} tasks={tasks} setTasks={setTasks} editing={editing?.type === "task" ? editing.item : null} draft={taskDraft} activeSeason={activeSeason} recordHistory={recordHistory} onClose={closeModal} />}
      {modal === "harvest" && <HarvestModal zones={zones} cultures={cultures} harvests={harvests} setHarvests={setHarvests} editing={editing?.type === "harvest" ? editing.item : null} activeSeason={activeSeason} recordHistory={recordHistory} onClose={closeModal} />}
      {modal === "journal" && <JournalModal zones={zones} cultures={cultures} journal={journal} setJournal={setJournal} editing={editing?.type === "journal" ? editing.item : null} activeSeason={activeSeason} recordHistory={recordHistory} onClose={closeModal} />}
    </div>
  );
}

const NOTIF_TONE = {
  blue: "bg-sky-50 border-sky-100",
  green: "bg-emerald-50 border-emerald-100",
  amber: "bg-amber-50 border-amber-100",
  red: "bg-rose-50 border-rose-100",
};

function NotificationBell({ tasks, cultures, journal, problems, onSelect, onEnableNative }) {
  const [open, setOpen] = useState(false);
  const items = useMemo(() => buildNotifications({ tasks, cultures, journal, problems }), [tasks, cultures, journal, problems]);

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl border border-garden-moss bg-white/70 hover:bg-garden-moss/40 transition text-garden-leaf">
        <Bell size={16} />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-garden-rose px-1 text-[9px] font-black text-white">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 grid w-80 gap-1.5 rounded-2xl border border-garden-moss bg-garden-paper p-3 shadow-soft max-h-[26rem] overflow-y-auto soft-scroll">
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-xs font-black uppercase tracking-wider text-garden-leaf">Notifications intelligentes</p>
            <button className="text-[11px] font-bold text-garden-pine underline" onClick={() => { onEnableNative(); setOpen(false); }}>Activer push</button>
          </div>
          {items.length ? items.map((n) => (
            <button key={n.id} onClick={() => { onSelect(n.target); setOpen(false); }}
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-left transition hover:brightness-95 ${NOTIF_TONE[n.tone] || NOTIF_TONE.blue}`}>
              <span className="text-lg leading-none mt-0.5">{n.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-garden-pine truncate">{n.title}</span>
                <span className="block text-xs text-garden-leaf truncate">{n.detail}</span>
              </span>
            </button>
          )) : (
            <p className="px-2 py-4 text-center text-sm text-garden-leaf">Aucune alerte pour le moment — tout va bien ! ✅</p>
          )}
        </div>
      )}
    </div>
  );
}

function QuickActions({ openModal }) {
  const [open, setOpen] = useState(false);
  const actions = [
    ["culture", "Ajouter une culture"],
    ["zone", "Ajouter une zone"],
    ["task", "Ajouter une tâche"],
    ["harvest", "Ajouter une récolte"]
  ];
  return (
    <div className="relative">
      <Button className="h-10 px-3 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Actions rapides">
        <Plus size={18} /><span className="hidden sm:inline">Ajouter</span>
      </Button>
      {open && (
        <div className="absolute right-0 top-12 z-50 grid w-56 gap-1 rounded-2xl border border-garden-moss bg-garden-paper p-2 shadow-soft md:hidden">
          {actions.map(([type, label]) => (
            <button key={type} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-garden-pine hover:bg-garden-moss"
              onClick={() => { openModal(type); setOpen(false); }}>
              <Plus size={16} />{label}
            </button>
          ))}
        </div>
      )}
      <div className="hidden gap-2 md:flex">
        <Button onClick={() => openModal("culture")}><Plus size={16} />Ajouter une culture</Button>
        <Button variant="secondary" onClick={() => openModal("zone")}><Plus size={16} />Ajouter une zone</Button>
        <Button variant="secondary" onClick={() => openModal("task")}><Plus size={16} />Ajouter une tâche</Button>
        <Button variant="secondary" onClick={() => openModal("harvest")}><Plus size={16} />Ajouter une récolte</Button>
      </div>
    </div>
  );
}

function Dashboard({ cultures, tasks, problems, zones, journal, history, harvests, overdueTasks, todayTasks, upcomingHarvests, watchedCultures, weather, weatherCity, setWeatherCity, weatherState }) {
  const [cityInput, setCityInput] = useState(weatherCity);
  const stats = [
    ["Cultures actives", cultures.filter((c) => c.status !== "terminé").length],
    ["Tâches en retard", overdueTasks.length],
    ["Récoltes prévues", upcomingHarvests.length],
    ["Récoltes saisies", harvests.length]
  ];
  const aiAnalysesCount = (history || []).filter((h) => h.type === "ai" || /analyse/i.test(h.label || "")).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="grid gap-5">
        <TodayInGarden tasks={tasks} cultures={cultures} problems={problems} watering={watchedCultures} />
        <section className="grid gap-4 md:grid-cols-4">
          {stats.map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-sm font-semibold text-garden-leaf">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </Card>
          ))}
        </section>
        <Card className="overflow-hidden bg-gradient-to-br from-garden-pine to-garden-leaf text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-white/75">Météo du jour</p>
                {weatherState === "loading" && <RefreshCw className="h-4 w-4 animate-spin text-white/75" />}
              </div>
              <h2 className="mt-2 text-3xl font-black">
                {weather ? `${weather.temperature}°C · ${weatherLabel(weather.code)}` : "Météo locale"}
              </h2>
              <p className="mt-2 max-w-xl text-white/80">
                {weather ? `${weather.city} · humidité ${weather.humidity}% · vent ${weather.wind} km/h · pluie ${weather.rain} mm. ${gardenAdvice(weather)}` : "Données réelles indisponibles pour l’instant. Le conseil local reste actif avec un fallback prudent."}
              </p>
              <div className="mt-4 flex max-w-md gap-2">
                <input
                  className="min-h-10 flex-1 rounded-xl border border-white/30 bg-white/15 px-3 text-sm text-white outline-none placeholder:text-white/60 focus:bg-white/20"
                  value={cityInput}
                  onChange={(event) => setCityInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && cityInput.trim() && setWeatherCity(cityInput.trim())}
                  placeholder="Ville météo"
                />
                <Button variant="secondary" className="border-white/30 bg-white/90" onClick={() => cityInput.trim() && setWeatherCity(cityInput.trim())}>
                  <RefreshCw size={16} />Actualiser
                </Button>
              </div>
            </div>
            <CloudSun className="h-24 w-24 text-garden-amber" />
          </div>
        </Card>
        <div className="grid gap-5 md:grid-cols-2">
          <ListCard title="Tâches du jour" items={todayTasks} empty="Aucune tâche prévue aujourd’hui." render={(task) => <TaskLine task={task} />} />
          <ListCard title="Prochaines récoltes" items={upcomingHarvests} empty="Aucune récolte planifiée." render={(culture) => (
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">{culture.plant} {culture.variety}</span>
              <Badge tone="green">{formatDate(culture.harvestDate)}</Badge>
            </div>
          )} />
        </div>
      </div>
      <div className="grid gap-5">
        <GardenerProgress cultures={cultures} tasks={tasks} harvests={harvests} journal={journal} zones={zones} history={history} aiAnalyses={aiAnalysesCount} />
        <ListCard title="Alertes importantes" items={overdueTasks} empty="Tout est à jour." icon={<AlertTriangle size={18} />} render={(task) => <TaskLine task={task} />} />
        <ListCard title="Cultures à surveiller" items={watchedCultures} empty="Aucune culture fragile." render={(culture) => (
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold">{culture.plant} {culture.variety}</span>
            <Badge tone={statusTone[culture.status]}>{culture.status}</Badge>
          </div>
        )} />
      </div>
    </div>
  );
}

function ListCard({ title, items, empty, render, icon }) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      <div className="grid gap-3">
        {items.length ? items.map((item) => <div key={item.id} className="rounded-2xl bg-garden-cream/70 p-3">{render(item)}</div>) : <p className="text-sm text-garden-leaf">{empty}</p>}
      </div>
    </Card>
  );
}

function TaskLine({ task }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-bold">{task.title}</p>
        <p className="text-xs text-garden-leaf">{task.zone} · {formatDate(task.dueDate)}</p>
      </div>
      <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
    </div>
  );
}

function ItemActions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" className="h-9 w-9 rounded-full p-0" onClick={onEdit} aria-label="Modifier">
        <Edit3 size={15} />
      </Button>
      <Button variant="danger" className="h-9 w-9 rounded-full p-0" onClick={onDelete} aria-label="Supprimer">
        <Trash2 size={15} />
      </Button>
    </div>
  );
}

function WeekFocus({ tasks, cultures, harvests, zones, problems, weather, openModal }) {
  const weekEnd = daysFromNow(7);
  const overdue = tasks.filter((task) => !task.completed && task.dueDate < todayIso());
  const nextTasks = tasks.filter((task) => !task.completed && task.dueDate >= todayIso() && task.dueDate <= weekEnd).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const soonHarvests = cultures.filter((culture) => culture.harvestDate && culture.harvestDate <= weekEnd).sort((a, b) => a.harvestDate.localeCompare(b.harvestDate));
  const watering = cultures
    .filter((culture) => culture.status !== "terminé")
    .map((culture) => ({ culture, advice: wateringAdviceFor(culture, zones, weather) }))
    .filter((item) => item.advice.tone !== "green")
    .slice(0, 6);
  const followUps = problems.filter((problem) => problem.followUpDate && problem.followUpDate <= weekEnd);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm font-semibold text-garden-leaf">En retard</p><p className="mt-2 text-3xl font-black">{overdue.length}</p></Card>
        <Card><p className="text-sm font-semibold text-garden-leaf">À faire 7 jours</p><p className="mt-2 text-3xl font-black">{nextTasks.length}</p></Card>
        <Card><p className="text-sm font-semibold text-garden-leaf">Récoltes proches</p><p className="mt-2 text-3xl font-black">{soonHarvests.length}</p></Card>
        <Card><p className="text-sm font-semibold text-garden-leaf">Suivis problèmes</p><p className="mt-2 text-3xl font-black">{followUps.length}</p></Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ListCard title="Tâches critiques" items={[...overdue, ...nextTasks].slice(0, 8)} empty="Rien d’urgent cette semaine." render={(task) => <TaskLine task={task} />} />
        <ListCard title="Récoltes à surveiller" items={soonHarvests.slice(0, 8)} empty="Aucune récolte proche." render={(culture) => (
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold">{culture.plant} {culture.variety}</span>
            <Badge tone={harvestCountdown(culture.harvestDate).tone}>{harvestCountdown(culture.harvestDate).label}</Badge>
          </div>
        )} />
        <Card>
          <h2 className="text-lg font-black">Arrosage intelligent</h2>
          <div className="mt-4 grid gap-3">
            {watering.map(({ culture, advice }) => (
              <div key={culture.id} className="rounded-2xl bg-garden-cream p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black">{culture.plant} {culture.variety}</p>
                  <Badge tone={advice.tone}>{advice.label}</Badge>
                </div>
                <p className="mt-1 text-xs font-semibold text-garden-leaf">{culture.zone} · {advice.reasons.join(", ") || "conditions normales"}</p>
              </div>
            ))}
            {!watering.length && <p className="text-sm font-semibold text-garden-leaf">Aucun arrosage prioritaire détecté.</p>}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Actions rapides</h2>
            <Button onClick={() => openModal("task")}><Plus size={16} />Ajouter tâche</Button>
          </div>
          <div className="mt-4 grid gap-3">
            {followUps.map((problem) => (
              <div key={problem.id} className="rounded-2xl bg-garden-cream p-3">
                <p className="font-black">{problem.culture}</p>
                <p className="text-sm text-garden-leaf">{problem.symptom} · suivi {formatDate(problem.followUpDate)}</p>
              </div>
            ))}
            {!followUps.length && <p className="text-sm font-semibold text-garden-leaf">Aucun suivi de problème à traiter cette semaine.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function GardenZones({ zones, setZones, openModal }) {
  return (
    <div className="grid gap-5">
      <Button className="w-fit" onClick={() => openModal("zone")}><Plus size={16} />Ajouter une zone</Button>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {zones.map((zone) => (
          <Card key={zone.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge>{zone.type}</Badge>
                <h2 className="mt-3 text-xl font-black">{zone.name}</h2>
              </div>
              <ItemActions onEdit={() => openModal("zone", zone)} onDelete={() => setZones(zones.filter((item) => item.id !== zone.id))} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <Info label="Exposition" value={zone.exposure} />
              <Info label="Surface / volume" value={zone.size} />
              <Info label="Notes" value={zone.notes} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {(zone.cultures ?? []).map((culture) => <Badge key={culture} tone="gray">{culture}</Badge>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Cultures({ cultures, setCultures, openModal }) {
  const [zoneFilter, setZoneFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [familyFilter, setFamilyFilter] = useState("Toutes");
  const zones = ["Toutes", ...new Set(cultures.map((culture) => culture.zone).filter(Boolean))];
  const families = ["Toutes", ...new Set(cultures.map((culture) => cropFamilies[culture.plant]).filter(Boolean))];
  const filteredCultures = cultures.filter((culture) => (
    (zoneFilter === "Toutes" || culture.zone === zoneFilter) &&
    (statusFilter === "Tous" || culture.status === statusFilter) &&
    (familyFilter === "Toutes" || cropFamilies[culture.plant] === familyFilter)
  ));

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <Button className="w-fit" onClick={() => openModal("culture")}><Plus size={16} />Ajouter une culture</Button>
        <select className={inputClass} value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)}>{zones.map((item) => <option key={item}>{item}</option>)}</select>
        <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{["Tous", ...statuses].map((item) => <option key={item}>{item}</option>)}</select>
        <select className={inputClass} value={familyFilter} onChange={(event) => setFamilyFilter(event.target.value)}>{families.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCultures.map((culture) => (
          <Card key={culture.id}>
            {(() => {
              const countdown = harvestCountdown(culture.harvestDate);
              return (
                <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{culture.plant}</h2>
                <p className="text-sm font-semibold text-garden-leaf">{culture.variety}</p>
              </div>
              <div className="grid justify-items-end gap-2">
                <Badge tone={statusTone[culture.status]}>{culture.status}</Badge>
                <ItemActions onEdit={() => openModal("culture", culture)} onDelete={() => setCultures(cultures.filter((item) => item.id !== culture.id))} />
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <Info label="Zone" value={culture.zone} />
              <Info label="Semis" value={formatDate(culture.sowingDate)} />
              <Info label="Plantation" value={formatDate(culture.plantingDate)} />
              <Info label="Arrosage" value={culture.watering} />
              <Info label="Prochaine action" value={culture.nextAction} />
              <Info label="Récolte estimée" value={formatDate(culture.harvestDate)} />
            </div>
            <div className="mt-4 rounded-2xl bg-garden-cream p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black">Fenêtre de récolte</p>
                <Badge tone={countdown.tone}>{countdown.label}</Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-garden-pine"
                  style={{ width: `${Math.max(8, Math.min(100, culture.harvestDate ? 100 - Math.max(0, Math.min(100, Math.ceil((new Date(culture.harvestDate) - new Date(todayIso())) / 86400000))) : 8))}%` }}
                />
              </div>
            </div>
            {culture.notes && <p className="mt-4 rounded-2xl bg-garden-cream/75 p-3 text-sm text-garden-leaf">{culture.notes}</p>}
            <CompanionHint plant={culture.plant} />
                </>
              );
            })()}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CompanionHint({ plant }) {
  const companions = companionPlants[plant];
  if (!companions) return null;
  return (
    <div className="mt-4 grid gap-2 rounded-2xl bg-garden-moss/70 p-3 text-sm">
      <p><strong>Bonnes associations :</strong> {companions.good.join(", ")}</p>
      <p><strong>À éviter :</strong> {companions.avoid.join(", ")}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-garden-moss/55 pb-2 last:border-0">
      <dt className="font-semibold text-garden-leaf">{label}</dt>
      <dd className="text-right font-bold">{value || "—"}</dd>
    </div>
  );
}

function CalendarView({ tasks, cultures, openTaskForDate }) {
  const [mode, setMode] = useState("mois");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(todayIso());
  const days = useMemo(() => Array.from({ length: mode === "mois" ? 30 : 7 }, (_, index) => {
    const date = new Date(cursor);
    date.setDate(date.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    return { date, iso };
  }), [mode, cursor]);

  const moveCalendar = (direction) => {
    const next = new Date(cursor);
    next.setDate(next.getDate() + direction * (mode === "mois" ? 30 : 7));
    setCursor(next);
  };

  const eventsFor = (iso) => [
    ...tasks.filter((task) => task.dueDate === iso).map((task) => ({ label: task.title, tone: priorityTone[task.priority] })),
    ...cultures.filter((culture) => culture.harvestDate === iso).map((culture) => ({ label: `Récolte ${culture.plant}`, tone: "green" })),
    ...cultures.filter((culture) => culture.plantingDate === iso).map((culture) => ({ label: `Planter ${culture.plant}`, tone: "blue" })),
    ...cultures.filter((culture) => culture.sowingDate === iso).map((culture) => ({ label: `Semis ${culture.plant}`, tone: "amber" }))
  ];

  const selectedEvents = eventsFor(selectedDay);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
    <Card>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Vue {mode}</h2>
          <p className="text-sm font-semibold text-garden-leaf">
            Depuis le {cursor.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl bg-garden-cream p-1">
            {["mois", "semaine"].map((item) => (
              <button key={item} onClick={() => setMode(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === item ? "bg-white shadow-card" : "text-garden-leaf"}`}>{item}</button>
            ))}
          </div>
          <Button variant="secondary" className="h-10 w-10 rounded-full p-0" onClick={() => moveCalendar(-1)} aria-label="Période précédente"><ChevronLeft size={17} /></Button>
          <Button variant="secondary" className="h-10 rounded-full px-3" onClick={() => setCursor(new Date())}>Aujourd’hui</Button>
          <Button variant="secondary" className="h-10 w-10 rounded-full p-0" onClick={() => moveCalendar(1)} aria-label="Période suivante"><ChevronRight size={17} /></Button>
        </div>
      </div>
      <div className={`soft-scroll grid gap-2 ${mode === "mois" ? "calendar-grid overflow-x-auto pb-2" : "grid-cols-1 sm:grid-cols-7"}`}>
        {days.map((day) => {
          const events = eventsFor(day.iso);
          return (
            <button key={day.iso} onClick={() => setSelectedDay(day.iso)} onDoubleClick={() => openTaskForDate(day.iso)} className={`min-h-32 rounded-2xl border p-3 text-left transition hover:border-garden-leaf hover:shadow-card ${selectedDay === day.iso ? "border-garden-pine bg-garden-moss/70" : "border-garden-moss/70 bg-garden-paper"}`}>
              <p className="text-sm font-black">{day.date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</p>
              <div className="mt-2 grid gap-1.5">
                {events.map((event, index) => <Badge key={`${event.label}-${index}`} tone={event.tone}>{event.label}</Badge>)}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
    <Card>
      <Badge tone="blue">{formatDate(selectedDay)}</Badge>
      <h2 className="mt-3 text-xl font-black">Agenda du jour</h2>
      <div className="mt-4 grid gap-2">
        {selectedEvents.map((event, index) => <Badge key={`${event.label}-${index}`} tone={event.tone}>{event.label}</Badge>)}
        {!selectedEvents.length && <p className="text-sm font-semibold text-garden-leaf">Aucun événement prévu.</p>}
      </div>
      <Button className="mt-5 w-full" onClick={() => openTaskForDate(selectedDay)}><Plus size={16} />Créer une tâche ce jour</Button>
      <p className="mt-3 text-xs font-semibold text-garden-leaf">Double-cliquez aussi sur une case du calendrier pour créer rapidement une tâche.</p>
    </Card>
    </div>
  );
}

function VegetableLibrary({ openCultureFromCard }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [difficultyFilter, setDifficultyFilter] = useState("Toutes");
  const cards = vegetableCards.filter((card) => {
    const type = card.type || inferCardType(card.name);
    return card.name.toLowerCase().includes(query.toLowerCase()) &&
      (typeFilter === "Tous" || type === typeFilter) &&
      (difficultyFilter === "Toutes" || card.difficulty === difficultyFilter);
  });
  const types = ["Tous", "Légume", "Fruit", "Aromate", "Fleur utile"];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-3">
        <input className={`${inputClass} min-w-64`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une fiche..." />
        <select className={inputClass} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          {types.map((type) => <option key={type}>{type}</option>)}
        </select>
        <select className={inputClass} value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)}>
          {["Toutes", "Facile", "Moyenne", "Difficile"].map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
        </select>
        <Badge tone="blue">{cards.length} fiches</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.name}>
            <VegetablePhoto name={card.name} />
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge tone="blue">{card.type || inferCardType(card.name)}</Badge>
                <h2 className="mt-2 text-xl font-black">{card.name}</h2>
              </div>
              <Badge tone={card.difficulty === "Difficile" ? "red" : card.difficulty === "Moyenne" ? "amber" : "green"}>{card.difficulty}</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <Info label="Semis" value={card.sowing} />
              <Info label="Plantation" value={card.planting} />
              <Info label="Récolte" value={card.harvest} />
              <Info label="Exposition" value={card.exposure} />
              <Info label="Eau" value={card.water} />
              <Info label="Sol" value={card.soil} />
              <Info label="Espacement" value={card.spacing} />
              <Info label="Récolte estimée" value={card.days} />
            </div>
            <CropCalendarStrip card={card} />
            <CropCompatibility card={card} />
            <div className="mt-4 grid gap-2 text-sm text-garden-leaf">
              <p><strong>Associations favorables :</strong> {card.goodWith}</p>
              <p><strong>À éviter :</strong> {card.avoidWith}</p>
              <p><strong>Maladies :</strong> {card.diseases}</p>
              <p><strong>Conseil naturel :</strong> {card.tips}</p>
              {card.uses && <p><strong>Intérêt au potager :</strong> {card.uses}</p>}
            </div>
            <Button className="mt-4 w-full" onClick={() => openCultureFromCard(card)}><Plus size={16} />Créer une culture</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CropCalendarStrip({ card }) {
  const enhancement = getCropEnhancement(card.name);
  return (
    <div className="mt-4 rounded-2xl bg-garden-cream p-3">
      <p className="text-sm font-black">Calendrier visuel</p>
      <div className="mt-2 grid grid-cols-12 gap-1">
        {monthLabels.map((month, index) => (
          <span key={`${card.name}-${month}-${index}`} className={`rounded-lg py-1 text-center text-xs font-black ${enhancement.months.includes(index) ? "bg-garden-pine text-white" : "bg-white text-garden-leaf"}`}>
            {month}
          </span>
        ))}
      </div>
    </div>
  );
}

function CropCompatibility({ card }) {
  const enhancement = getCropEnhancement(card.name);
  return (
    <div className="mt-3 grid gap-2 rounded-2xl bg-garden-moss/70 p-3 text-sm">
      <p><strong>Variétés :</strong> {enhancement.varieties.join(", ")}</p>
      <p><strong>Compatible :</strong> {enhancement.compatible.join(", ")}</p>
      <p><strong>Hydroponie :</strong> {enhancement.hydro}</p>
    </div>
  );
}

function VegetablePhoto({ name }) {
  const cacheKey = `pilot-potager:photo:${name}`;
  const [src, setSrc] = useState(() => localStorage.getItem(cacheKey));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (src) return;
    let ignored = false;
    const page = vegetableWikiPages[name] ?? name;
    const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Image introuvable");
        return response.json();
      })
      .then((data) => {
        const image = data.thumbnail?.source || data.originalimage?.source;
        if (!ignored && image) {
          localStorage.setItem(cacheKey, image);
          setSrc(image);
        }
      })
      .catch(() => {
        if (!ignored) setFailed(true);
      });

    return () => {
      ignored = true;
    };
  }, [cacheKey, name, src]);

  return (
    <div className="mb-4 flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-garden-moss to-garden-sage text-garden-pine">
      {src && !failed ? (
        <img
          className="h-full w-full object-cover"
          src={src}
          alt={`Photo de ${name}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid justify-items-center gap-2 text-sm font-bold">
          <Leaf size={30} />
          <span>{name}</span>
        </div>
      )}
    </div>
  );
}

function Tasks({ tasks, setTasks, openModal }) {
  const toggle = (task) => setTasks(tasks.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item));
  const remove = (task) => setTasks(tasks.filter((item) => item.id !== task.id));
  const remind = (task) => {
    requestGardenNotifications([task], []).then(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Rappel planifié", { body: `${task.title} · ${formatDate(task.dueDate)}`, icon: "/icon.svg" });
      }
    });
  };

  return (
    <div className="grid gap-5">
      <Button className="w-fit" onClick={() => openModal("task")}><Plus size={16} />Ajouter une tâche</Button>
      <div className="grid gap-3">
        {tasks.map((task) => (
          <Card key={task.id} className={task.completed ? "opacity-65" : ""}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={`text-lg font-black ${task.completed ? "line-through" : ""}`}>{task.title}</h2>
                  <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
                  <Badge tone="blue">{task.category}</Badge>
                </div>
                <p className="mt-1 text-sm text-garden-leaf">{formatDate(task.dueDate)} · {task.zone} · {task.culture}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => openModal("task", task)}><Edit3 size={16} />Modifier</Button>
                <Button variant="secondary" onClick={() => toggle(task)}>{task.completed ? "Réouvrir" : "Terminer"}</Button>
                <Button variant="secondary" onClick={() => remind(task)}><Bell size={16} />Rappel</Button>
                <Button variant="danger" onClick={() => remove(task)}><Trash2 size={16} />Supprimer</Button>
              </div>
            </div>
          </Card>
        ))}
        {!tasks.length && <EmptyState title="Aucune tâche" text="Ajoutez votre premier rappel de jardinage." />}
      </div>
    </div>
  );
}

function PhotoJournal({ journal, setJournal, openModal }) {
  return (
    <div className="grid gap-5">
      <Button className="w-fit" onClick={() => openModal("journal")}><Plus size={16} />Ajouter une entrée</Button>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {journal.map((entry) => (
          <Card key={entry.id}>
            <div className="mb-4 flex h-44 items-center justify-center rounded-2xl border border-dashed border-garden-sage bg-garden-cream text-garden-leaf">
              {entry.photo ? <img className="h-full w-full rounded-2xl object-cover" src={entry.photo} alt={entry.culture} /> : <Camera size={34} />}
            </div>
            <div className="flex items-start justify-between gap-3">
              <Badge tone="blue">{formatDate(entry.date)}</Badge>
              <ItemActions onEdit={() => openModal("journal", entry)} onDelete={() => setJournal(journal.filter((item) => item.id !== entry.id))} />
            </div>
            <h2 className="mt-3 text-xl font-black">{entry.culture}</h2>
            <p className="text-sm font-semibold text-garden-leaf">{entry.zone}</p>
            <p className="mt-3 text-sm">{entry.note}</p>
            <div className="mt-4 grid gap-2 text-sm">
              <Info label="État observé" value={entry.observation} />
              <Info label="Problème" value={entry.issue} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GardenAssistant({ cultures, zones, tasks, setTasks, harvests, weather }) {
  const examples = [
    "Que planter cette semaine ?",
    "Pourquoi mes feuilles jaunissent ?",
    "Quand arroser mes tomates ?",
    "Que puis-je planter avec mes salades ?",
    "Comment gérer les pucerons naturellement ?",
    "Quelles cultures surveiller aujourd’hui ?",
    "Quelles tâches sont urgentes ?",
    "Quel bilan de récolte ?"
  ];
  const generateAnswer = (question) => {
    const text = question.toLowerCase();
    const activeCultures = cultures.filter((culture) => culture.status !== "terminé");
    const fragileCultures = cultures.filter((culture) => ["à surveiller", "malade"].includes(culture.status));
    const openTasks = tasks.filter((task) => !task.completed);
    const urgentTasks = openTasks.filter((task) => task.priority === "haute" || task.dueDate <= todayIso());
    const tomatoCultures = cultures.filter((culture) => culture.plant.toLowerCase().includes("tomate"));
    const saladCultures = cultures.filter((culture) => culture.plant.toLowerCase().includes("salade"));
    const weatherHint = weather ? ` Aujourd’hui : ${weather.temperature}°C, ${weather.rain} mm de pluie, vent ${weather.wind} km/h.` : "";

    if (text.includes("planter") || text.includes("semer")) {
      const zonesText = zones.length ? `Tu as ${zones.length} zones disponibles : ${zones.map((zone) => zone.name).join(", ")}.` : "Ajoute d’abord une zone pour mieux planifier.";
      return `${zonesText} En fin mai, privilégie haricots, radis, salades d’été, courgettes, concombres et basilic. Si tes nuits restent douces, les tomates, poivrons et aubergines peuvent rester dehors ou en serre.${weatherHint}`;
    }

    if (text.includes("jaunissent") || text.includes("jaune")) {
      const watched = fragileCultures.length ? ` Dans ton potager, surveille surtout : ${fragileCultures.map((culture) => `${culture.plant} ${culture.variety}`.trim()).join(", ")}.` : "";
      return `Les feuilles jaunes viennent souvent d’un excès d’eau, d’un manque d’azote, d’un stress de repiquage ou d’un sol trop froid. Vérifie l’humidité à 3 cm, le drainage et les nouvelles pousses.${watched}`;
    }

    if (text.includes("arroser") || text.includes("arrosage")) {
      const tomatoText = tomatoCultures.length ? ` Pour tes tomates (${tomatoCultures.map((culture) => culture.zone).join(", ")}), arrose au pied en profondeur, sans mouiller le feuillage.` : " Pour les tomates, arrose au pied en profondeur, sans mouiller le feuillage.";
      const rainText = weather?.rain >= 3 ? "La pluie prévue permet probablement de réduire l’arrosage extérieur." : "Si le sol est sec en surface et en profondeur, arrose tôt le matin ou le soir.";
      return `${tomatoText} ${rainText}${weatherHint}`;
    }

    if (text.includes("salade") || text.includes("salades")) {
      const planted = saladCultures.length ? ` Tu as déjà ${saladCultures.length} culture(s) de salade : ${saladCultures.map((culture) => culture.zone).join(", ")}.` : "";
      return `Les salades vont bien avec radis, carottes, fraises, concombres et aromates doux. Évite la proximité du persil. En été, place-les plutôt à mi-ombre et garde le sol frais.${planted}`;
    }

    if (text.includes("puceron")) {
      return "Commence par observer le dessous des feuilles, puis retire les foyers au jet d’eau doux. Si besoin, pulvérise du savon noir dilué le soir. Évite de traiter en plein soleil et garde quelques fleurs pour attirer les auxiliaires.";
    }

    if (text.includes("surveiller") || text.includes("malade")) {
      if (!fragileCultures.length) return `Aucune culture marquée à surveiller ou malade pour l’instant. Continue surtout l’observation des feuilles, l’humidité du sol et les tuteurs.${weatherHint}`;
      return `À surveiller aujourd’hui : ${fragileCultures.map((culture) => `${culture.plant} ${culture.variety} dans ${culture.zone} (${culture.status})`).join("; ")}.${weatherHint}`;
    }

    if (text.includes("tâche") || text.includes("urgent") || text.includes("urgence")) {
      if (!urgentTasks.length) return "Aucune tâche urgente détectée. Tu peux avancer sur les entretiens légers : observation, paillage, désherbage doux et vérification des supports.";
      return `Tâches prioritaires : ${urgentTasks.map((task) => `${task.title} (${task.zone}, ${formatDate(task.dueDate)})`).join("; ")}. Commence par les priorités hautes et les dates du jour ou passées.`;
    }

    if (text.includes("récolte") || text.includes("bilan")) {
      const culturesText = harvests.length ? [...new Set(harvests.map((harvest) => harvest.culture))].join(", ") : "aucune récolte enregistrée";
      return `Tu as enregistré ${harvests.length} récolte(s). Cultures concernées : ${culturesText}. Pour un meilleur suivi, saisis toujours une quantité comparable, par exemple en grammes ou en nombre de pièces.`;
    }

    return `D’après ton potager, tu as ${activeCultures.length} culture(s) active(s), ${zones.length} zone(s) et ${openTasks.length} tâche(s) ouverte(s). Pose-moi une question sur l’arrosage, les tâches urgentes, les cultures à surveiller, les associations ou les récoltes.`;
  };
  const [messages, setMessages] = useState([{ role: "assistant", text: "Bonjour, je suis votre assistant potager local. Posez-moi une question ou choisissez un exemple." }]);
  const [input, setInput] = useState("");
  const [weeklyPlan, setWeeklyPlan] = useState([]);

  const buildWeeklyPlan = () => cultures.slice(0, 6).map((culture, index) => ({
    id: makeId("task"),
    title: `${index % 2 === 0 ? "Observer" : "Entretenir"} ${culture.plant} ${culture.variety}`.trim(),
    priority: culture.status === "malade" ? "haute" : culture.status === "à surveiller" ? "moyenne" : "basse",
    category: culture.status === "malade" ? "traitement" : "entretien",
    dueDate: daysFromNow(index + 1),
    zone: culture.zone,
    culture: `${culture.plant} ${culture.variety}`.trim(),
    completed: false
  }));

  const ask = async (question) => {
    const text = question || input.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: "user", text }]);
    setInput("");
    const remote = await askRemoteAssistant({ question: text, context: { cultures, zones, tasks, harvests, weather } }).catch(() => ({ ok: false }));
    setMessages((current) => [...current, { role: "assistant", text: remote?.ok && remote.answer ? remote.answer : generateAnswer(text) }]);
  };
  const createAssistantTasks = () => {
    const generated = cultures
      .filter((culture) => culture.status === "à surveiller" || culture.status === "malade")
      .map((culture) => ({
        id: makeId("task"),
        title: `Observer ${culture.plant} ${culture.variety}`.trim(),
        priority: culture.status === "malade" ? "haute" : "moyenne",
        category: "entretien",
        dueDate: todayIso(),
        zone: culture.zone,
        culture: `${culture.plant} ${culture.variety}`.trim(),
        completed: false
      }));
    if (!generated.length) return;
    setTasks([...tasks, ...generated]);
    setMessages((current) => [...current, { role: "assistant", text: `${generated.length} tâche(s) d'observation ont été créées pour les cultures à surveiller.` }]);
  };
  const proposeWeeklyPlan = () => {
    const plan = buildWeeklyPlan();
    setWeeklyPlan(plan);
    setMessages((current) => [...current, { role: "assistant", text: `J’ai préparé un plan hebdomadaire de ${plan.length} action(s). Vous pouvez l’appliquer depuis le panneau de gauche.` }]);
  };
  const applyWeeklyPlan = () => {
    if (!weeklyPlan.length) return;
    setTasks([...tasks, ...weeklyPlan]);
    setMessages((current) => [...current, { role: "assistant", text: `${weeklyPlan.length} tâche(s) du plan hebdomadaire ont été ajoutées.` }]);
    setWeeklyPlan([]);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
      <Card>
        <h2 className="text-xl font-black">Questions rapides</h2>
        <div className="mt-4 grid gap-2">
          {examples.map((example) => <Button key={example} variant="secondary" className="justify-start text-left" onClick={() => ask(example)}>{example}</Button>)}
          <Button onClick={createAssistantTasks}><Plus size={16} />Créer les tâches proposées</Button>
          <Button variant="secondary" onClick={proposeWeeklyPlan}><CalendarDays size={16} />Proposer la semaine</Button>
          {weeklyPlan.length > 0 && <Button onClick={applyWeeklyPlan}><CheckCircle2 size={16} />Appliquer le plan</Button>}
        </div>
      </Card>
      <Card className="grid min-h-[560px] grid-rows-[1fr_auto]">
        <div className="soft-scroll grid max-h-[460px] content-start gap-3 overflow-auto pr-1">
          {messages.map((message, index) => (
            <div key={index} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.role === "user" ? "ml-auto bg-garden-pine text-white" : "bg-garden-cream text-garden-pine"}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input className={`${inputClass} flex-1`} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && ask()} placeholder="Écrire une question..." />
          <Button onClick={() => ask()}>Envoyer</Button>
        </div>
      </Card>
    </div>
  );
}

function Harvests({ harvests, setHarvests, openModal }) {
  const monthly = harvests.filter((harvest) => harvest.date?.slice(0, 7) === todayIso().slice(0, 7));
  const totalGrams = harvests.reduce((sum, harvest) => sum + parseQuantity(harvest.quantity), 0);
  const cultureTotals = harvests.reduce((acc, harvest) => {
    acc[harvest.culture] = (acc[harvest.culture] || 0) + parseQuantity(harvest.quantity);
    return acc;
  }, {});
  const bestCultures = Object.entries(cultureTotals).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name]) => name);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm font-semibold text-garden-leaf">Total récolté</p><p className="mt-2 text-3xl font-black">{totalGrams ? `${Math.round(totalGrams)} g` : harvests.length}</p></Card>
        <Card><p className="text-sm font-semibold text-garden-leaf">Récoltes du mois</p><p className="mt-2 text-3xl font-black">{monthly.length}</p></Card>
        <Card><p className="text-sm font-semibold text-garden-leaf">Meilleures cultures</p><p className="mt-2 text-lg font-black">{bestCultures.join(", ") || "À venir"}</p></Card>
      </div>
      <Button className="w-fit" onClick={() => openModal("harvest")}><Plus size={16} />Ajouter une récolte</Button>
      <div className="grid gap-3">
        {harvests.map((harvest) => (
          <Card key={harvest.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black">{harvest.culture}</h2>
                <p className="text-sm text-garden-leaf">{formatDate(harvest.date)} · {harvest.zone}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{harvest.quantity}</Badge>
                <Badge tone={harvest.quality === "excellente" ? "green" : harvest.quality === "bonne" ? "blue" : "amber"}>{harvest.quality}</Badge>
                <ItemActions onEdit={() => openModal("harvest", harvest)} onDelete={() => setHarvests(harvests.filter((item) => item.id !== harvest.id))} />
              </div>
            </div>
            {harvest.notes && <p className="mt-3 text-sm text-garden-leaf">{harvest.notes}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CultureTimeline({ cultures, tasks, harvests, journal, seedlings, problems }) {
  const [selected, setSelected] = useState(cultures[0]?.id ?? "");
  const culture = cultures.find((item) => item.id === selected) ?? cultures[0];
  const cultureName = culture ? `${culture.plant} ${culture.variety}`.trim() : "";
  const events = culture ? [
    culture.sowingDate && { date: culture.sowingDate, title: "Semis", text: cultureName, tone: "amber" },
    culture.plantingDate && { date: culture.plantingDate, title: "Plantation", text: culture.zone, tone: "blue" },
    culture.harvestDate && { date: culture.harvestDate, title: "Récolte estimée", text: culture.nextAction, tone: "green" },
    ...tasks.filter((task) => task.culture.includes(culture.plant) || task.culture.includes(culture.variety)).map((task) => ({ date: task.dueDate, title: task.title, text: task.category, tone: priorityTone[task.priority] })),
    ...harvests.filter((harvest) => harvest.culture.includes(culture.plant) || harvest.culture.includes(culture.variety)).map((harvest) => ({ date: harvest.date, title: `Récolte ${harvest.quantity}`, text: harvest.quality, tone: "green" })),
    ...journal.filter((entry) => entry.culture.includes(culture.plant) || entry.culture.includes(culture.variety)).map((entry) => ({ date: entry.date, title: entry.observation || "Observation", text: entry.note, tone: "blue", photo: entry.photo })),
    ...seedlings.filter((seedling) => seedling.plant.includes(culture.plant) || culture.plant.includes(seedling.plant)).map((seedling) => ({ date: seedling.sowingDate, title: `Semis ${seedling.variety}`, text: `Levée estimée ${formatDate(seedling.expectedGermination)} · réussite ${seedling.successRate || "?"}%`, tone: "amber" })),
    ...problems.filter((problem) => problem.culture.includes(culture.plant) || problem.culture.includes(culture.variety)).map((problem) => ({ date: problem.date, title: `Problème : ${problem.symptom}`, text: `${problem.action} · résultat : ${problem.result}`, tone: "red" }))
  ].filter(Boolean).sort((a, b) => a.date.localeCompare(b.date)) : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[0.35fr_0.65fr]">
      <Card>
        <h2 className="text-xl font-black">Cultures</h2>
        <div className="mt-4 grid gap-2">
          {cultures.map((item) => (
            <button key={item.id} onClick={() => setSelected(item.id)} className={`rounded-2xl px-4 py-3 text-left font-bold transition ${culture?.id === item.id ? "bg-garden-pine text-white" : "bg-garden-cream text-garden-pine hover:bg-garden-moss"}`}>
              {item.plant} {item.variety}
              <span className="block text-xs opacity-75">{item.zone}</span>
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-black">Timeline culture</h2>
        <div className="mt-5 grid gap-4">
          {events.map((event, index) => (
            <div key={`${event.title}-${index}`} className="grid gap-3 rounded-2xl bg-garden-cream/70 p-4 sm:grid-cols-[8rem_1fr]">
              <Badge tone={event.tone}>{formatDate(event.date)}</Badge>
              <div>
                <p className="font-black">{event.title}</p>
                <p className="mt-1 text-sm text-garden-leaf">{event.text}</p>
                {event.photo && <img className="mt-3 h-32 w-full rounded-2xl object-cover" src={event.photo} alt={event.title} />}
              </div>
            </div>
          ))}
          {!events.length && <EmptyState title="Timeline vide" text="Ajoutez des dates, tâches, récoltes ou observations pour nourrir l’historique." />}
        </div>
      </Card>
    </div>
  );
}

function GardenPlan({ zones, cultures, setCultures, recordHistory }) {
  const [draggedCultureId, setDraggedCultureId] = useState(null);
  const zoneCultures = (zone) => cultures.filter((culture) => culture.zone === zone.name);
  const moveCulture = (cultureId, zoneName) => {
    const culture = cultures.find((item) => item.id === cultureId);
    if (!culture || culture.zone === zoneName) return;
    setCultures(cultures.map((item) => item.id === cultureId ? { ...item, zone: zoneName, updatedAt: new Date().toISOString() } : item));
    recordHistory?.("plan", `${culture.plant} déplacé vers ${zoneName}`);
  };

  return (
    <div className="grid gap-5">
      <Card>
        <h2 className="text-xl font-black">Plan visuel du potager</h2>
        <p className="mt-1 text-sm font-semibold text-garden-leaf">Déplacez une culture par glisser-déposer ou avec le sélecteur de zone.</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {zones.map((zone) => {
          const items = zoneCultures(zone);
          return (
            <Card
              key={zone.id}
              className="min-h-80"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedCultureId) moveCulture(draggedCultureId, zone.name);
                setDraggedCultureId(null);
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge>{zone.type}</Badge>
                  <h2 className="mt-2 text-xl font-black">{zone.name}</h2>
                </div>
                <span className="text-sm font-bold text-garden-leaf">{zone.size}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((culture) => (
                  <div
                    key={culture.id}
                    draggable
                    onDragStart={() => setDraggedCultureId(culture.id)}
                    onDragEnd={() => setDraggedCultureId(null)}
                    className="min-h-28 rounded-2xl border border-garden-moss bg-garden-paper p-3 transition hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <p className="font-black">{culture.plant}</p>
                    <p className="text-xs font-semibold text-garden-leaf">{cropFamilies[culture.plant] || "Famille à définir"}</p>
                    <Badge tone={statusTone[culture.status]}>{culture.status}</Badge>
                    <select className={`${inputClass} mt-2 min-h-9 w-full py-1 text-xs`} value={culture.zone} onChange={(event) => moveCulture(culture.id, event.target.value)}>
                      {zones.map((target) => <option key={target.id} value={target.name}>{target.name}</option>)}
                    </select>
                  </div>
                ))}
                {!items.length && <div className="col-span-2 rounded-2xl border border-dashed border-garden-sage p-5 text-center text-sm font-semibold text-garden-leaf">Zone libre</div>}
              </div>
              <RotationHint cultures={items} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RotationHint({ cultures }) {
  const families = cultures.map((culture) => cropFamilies[culture.plant]).filter(Boolean);
  const duplicate = families.find((family, index) => families.indexOf(family) !== index);
  return (
    <p className={`mt-4 rounded-2xl p-3 text-sm font-semibold ${duplicate ? "bg-amber-100 text-amber-800" : "bg-garden-moss text-garden-pine"}`}>
      {duplicate ? `Rotation à surveiller : plusieurs ${duplicate} dans cette zone.` : "Rotation correcte : familles variées ou zone peu chargée."}
    </p>
  );
}

function DiagnosticCenter({ cultures }) {
  const [symptom, setSymptom] = useState("Feuilles jaunes");
  const [culture, setCulture] = useState(cultures[0] ? `${cultures[0].plant} ${cultures[0].variety}`.trim() : "");
  const [severity, setSeverity] = useState("modéré");
  const active = cultures.find((item) => `${item.plant} ${item.variety}`.trim() === culture);
  const severityAdvice = {
    léger: "Surveillez 48 h avant d'intervenir lourdement.",
    modéré: "Agissez maintenant avec une correction douce et notez l'évolution.",
    fort: "Isolez la plante si possible, retirez les parties très atteintes et priorisez cette action aujourd'hui."
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.45fr_0.55fr]">
      <Card>
        <h2 className="text-xl font-black">Diagnostic naturel</h2>
        <div className="mt-4 grid gap-4">
          <SelectField label="Culture concernée" value={culture} options={cultures.map((item) => `${item.plant} ${item.variety}`.trim())} onChange={setCulture} />
          <SelectField label="Symptôme" value={symptom} options={Object.keys(diagnosticRules)} onChange={setSymptom} />
          <SelectField label="Intensité" value={severity} options={["léger", "modéré", "fort"]} onChange={setSeverity} />
        </div>
      </Card>
      <Card>
        <Badge tone={active?.status === "malade" ? "red" : active?.status === "à surveiller" ? "amber" : "green"}>{active?.status || "Observation"}</Badge>
        <h2 className="mt-3 text-2xl font-black">{symptom}</h2>
        <p className="mt-3 text-garden-leaf">{diagnosticRules[symptom]}</p>
        <p className="mt-3 rounded-2xl bg-garden-cream p-3 text-sm font-semibold text-garden-pine">{severityAdvice[severity]}</p>
        <div className="mt-5 grid gap-2 text-sm">
          <Info label="Zone" value={active?.zone} />
          <Info label="Famille" value={active ? cropFamilies[active.plant] : ""} />
          <Info label="Action suivante" value={active?.nextAction} />
        </div>
      </Card>
    </div>
  );
}

function SeedlingsManager({ seedlings, setSeedlings, recordHistory }) {
  const [form, setForm] = useState({ plant: "", variety: "", sowingDate: todayIso(), expectedGermination: daysFromNow(10), transplantDate: daysFromNow(45), successRate: "", tray: "", notes: "" });
  const add = () => {
    if (!form.plant.trim()) return;
    const payload = { ...form, id: makeId("seedling") };
    setSeedlings([...seedlings, payload]);
    recordHistory?.("semis", `Ajout semis : ${payload.plant} ${payload.variety}`.trim());
    setForm({ plant: "", variety: "", sowingDate: todayIso(), expectedGermination: daysFromNow(10), transplantDate: daysFromNow(45), successRate: "", tray: "", notes: "" });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
      <Card>
        <h2 className="text-xl font-black">Plateau de semis</h2>
        <div className="mt-4 grid gap-4">
          <TextField label="Culture" value={form.plant} onChange={(plant) => setForm({ ...form, plant })} />
          <TextField label="Variété" value={form.variety} onChange={(variety) => setForm({ ...form, variety })} />
          <TextField label="Date de semis" type="date" value={form.sowingDate} onChange={(sowingDate) => setForm({ ...form, sowingDate })} />
          <TextField label="Levée estimée" type="date" value={form.expectedGermination} onChange={(expectedGermination) => setForm({ ...form, expectedGermination })} />
          <TextField label="Repiquage prévu" type="date" value={form.transplantDate} onChange={(transplantDate) => setForm({ ...form, transplantDate })} />
          <TextField label="Taux de réussite (%)" value={form.successRate} onChange={(successRate) => setForm({ ...form, successRate })} />
          <TextField label="Plateau / emplacement" value={form.tray} onChange={(tray) => setForm({ ...form, tray })} />
          <TextArea label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
          <Button onClick={add}><Plus size={16} />Ajouter le semis</Button>
        </div>
      </Card>
      <div className="grid gap-3">
        {seedlings.map((seedling) => (
          <Card key={seedling.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">{seedling.plant} {seedling.variety}</h2>
                <p className="text-sm font-semibold text-garden-leaf">{seedling.tray}</p>
              </div>
              <Button variant="danger" className="h-9 w-9 rounded-full p-0" onClick={() => setSeedlings(seedlings.filter((item) => item.id !== seedling.id))}><Trash2 size={15} /></Button>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <Info label="Semis" value={formatDate(seedling.sowingDate)} />
              <Info label="Levée estimée" value={formatDate(seedling.expectedGermination)} />
              <Info label="Repiquage" value={formatDate(seedling.transplantDate)} />
              <Info label="Réussite" value={seedling.successRate ? `${seedling.successRate}%` : "À renseigner"} />
            </div>
            {seedling.notes && <p className="mt-3 text-sm text-garden-leaf">{seedling.notes}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProblemsLog({ problems, setProblems, cultures, recordHistory }) {
  const [form, setForm] = useState({ date: todayIso(), culture: cultures[0] ? `${cultures[0].plant} ${cultures[0].variety}`.trim() : "", symptom: "", suspectedCause: "", action: "", followUpDate: daysFromNow(7), result: "" });
  const add = () => {
    if (!form.symptom.trim()) return;
    const payload = { ...form, id: makeId("problem") };
    setProblems([...problems, payload]);
    recordHistory?.("problème", `${payload.culture} : ${payload.symptom}`);
    setForm({ date: todayIso(), culture: cultures[0] ? `${cultures[0].plant} ${cultures[0].variety}`.trim() : "", symptom: "", suspectedCause: "", action: "", followUpDate: daysFromNow(7), result: "" });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
      <Card>
        <h2 className="text-xl font-black">Journal de problèmes</h2>
        <div className="mt-4 grid gap-4">
          <TextField label="Date" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
          <SelectField label="Culture" value={form.culture} options={cultures.map((culture) => `${culture.plant} ${culture.variety}`.trim())} onChange={(culture) => setForm({ ...form, culture })} />
          <TextField label="Symptôme" value={form.symptom} onChange={(symptom) => setForm({ ...form, symptom })} />
          <TextField label="Cause suspectée" value={form.suspectedCause} onChange={(suspectedCause) => setForm({ ...form, suspectedCause })} />
          <TextField label="Action faite" value={form.action} onChange={(action) => setForm({ ...form, action })} />
          <TextField label="Date de suivi" type="date" value={form.followUpDate} onChange={(followUpDate) => setForm({ ...form, followUpDate })} />
          <TextArea label="Résultat" value={form.result} onChange={(result) => setForm({ ...form, result })} />
          <Button onClick={add}><Plus size={16} />Ajouter le problème</Button>
        </div>
      </Card>
      <div className="grid gap-3">
        {problems.map((problem) => (
          <Card key={problem.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone={problem.followUpDate <= todayIso() ? "amber" : "blue"}>{formatDate(problem.followUpDate)}</Badge>
                <h2 className="mt-2 text-lg font-black">{problem.culture}</h2>
                <p className="text-sm text-garden-leaf">{problem.symptom}</p>
              </div>
              <Button variant="danger" className="h-9 w-9 rounded-full p-0" onClick={() => setProblems(problems.filter((item) => item.id !== problem.id))}><Trash2 size={15} /></Button>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <Info label="Cause suspectée" value={problem.suspectedCause} />
              <Info label="Action" value={problem.action} />
              <Info label="Résultat" value={problem.result} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StockManager({ stocks, setStocks }) {
  const [form, setForm] = useState({ name: "", category: "graines", variety: "", supplier: "", purchaseDate: "", expiryDate: "", quantity: "", threshold: "", notes: "" });
  const shoppingList = stocks.filter((item) => item.quantity && item.threshold && item.quantity === item.threshold);
  const expiringSeeds = stocks.filter((item) => item.expiryDate && item.expiryDate <= daysFromNow(90));
  const addStock = () => {
    if (!form.name.trim()) return;
    setStocks([...stocks, { ...form, id: makeId("stock") }]);
    setForm({ name: "", category: "graines", variety: "", supplier: "", purchaseDate: "", expiryDate: "", quantity: "", threshold: "", notes: "" });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
      <Card>
        <h2 className="text-xl font-black">Ajouter au stock</h2>
        <div className="mt-4 grid gap-4">
          <TextField label="Nom" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <SelectField label="Catégorie" value={form.category} options={["graines", "terreau", "engrais", "paillage", "support", "traitement", "outil"]} onChange={(category) => setForm({ ...form, category })} />
          <TextField label="Variété" value={form.variety} onChange={(variety) => setForm({ ...form, variety })} />
          <TextField label="Fournisseur" value={form.supplier} onChange={(supplier) => setForm({ ...form, supplier })} />
          <TextField label="Date d’achat" type="date" value={form.purchaseDate} onChange={(purchaseDate) => setForm({ ...form, purchaseDate })} />
          <TextField label="À utiliser avant" type="date" value={form.expiryDate} onChange={(expiryDate) => setForm({ ...form, expiryDate })} />
          <TextField label="Quantité" value={form.quantity} onChange={(quantity) => setForm({ ...form, quantity })} />
          <TextField label="Seuil d’alerte" value={form.threshold} onChange={(threshold) => setForm({ ...form, threshold })} />
          <TextArea label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
          <Button onClick={addStock}><Plus size={16} />Ajouter</Button>
        </div>
      </Card>
      <div className="grid gap-3">
        <Card>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            <h2 className="text-xl font-black">Liste d’achats automatique</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {shoppingList.length ? shoppingList.map((item) => <Badge key={item.id} tone="amber">{item.name}</Badge>) : <p className="text-sm font-semibold text-garden-leaf">Aucun stock au seuil d’alerte exact pour l’instant.</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {expiringSeeds.map((item) => <Badge key={`expire-${item.id}`} tone="red">{item.name} avant {formatDate(item.expiryDate)}</Badge>)}
          </div>
        </Card>
        {stocks.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone="blue">{item.category}</Badge>
                <h2 className="mt-2 text-lg font-black">{item.name}</h2>
                <p className="text-sm text-garden-leaf">Quantité : {item.quantity} · seuil : {item.threshold}</p>
                {(item.variety || item.supplier || item.expiryDate) && <p className="text-sm text-garden-leaf">{item.variety} {item.supplier && `· ${item.supplier}`} {item.expiryDate && `· avant ${formatDate(item.expiryDate)}`}</p>}
                {item.notes && <p className="mt-2 text-sm">{item.notes}</p>}
              </div>
              <Button variant="danger" className="h-9 w-9 rounded-full p-0" onClick={() => setStocks(stocks.filter((stock) => stock.id !== item.id))}><Trash2 size={15} /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SeasonTools({ zones, cultures, tasks, harvests, journal, stocks, seasons, history, seedlings, problems, activeSeason, setZones, setCultures, setTasks, setHarvests, setJournal, setStocks, setSeasons, setSeedlings, setProblems, recordHistory }) {
  const [importText, setImportText] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const currentMonth = new Date().getMonth();
  const snapshot = { exportedAt: new Date().toISOString(), zones, cultures, tasks, harvests, journal, stocks, seasons, seedlings, problems };
  const [backupDate, setBackupDate] = useState(() => localStorage.getItem("pilot-potager:last-backup") || "");
  const createPlanning = () => {
    const generated = cultures.flatMap((culture) => autoTaskTemplates
      .filter((template) => culture.plant.toLowerCase().includes(template.match))
      .map((template) => {
        const date = new Date();
        date.setDate(date.getDate() + template.offset);
        return {
          id: makeId("task"),
          title: template.title,
          priority: template.priority,
          category: template.category,
          dueDate: date.toISOString().slice(0, 10),
          zone: culture.zone,
          culture: `${culture.plant} ${culture.variety}`.trim(),
          completed: false
        };
      }));
    setTasks([...tasks, ...generated]);
    recordHistory("planning", `${generated.length} tâches générées automatiquement`);
  };
  const archiveSeason = () => {
    const year = String(new Date().getFullYear());
    setSeasons(seasons.map((season) => ({ ...season, status: "archived" })).concat({ id: makeId("season"), name: `Saison ${year}`, year, status: "active", notes: "Nouvelle saison créée localement." }));
    recordHistory("saison", `Nouvelle saison ${year}`);
  };
  const downloadExport = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pilot-potager-${todayIso()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    localStorage.setItem("pilot-potager:last-backup", new Date().toISOString());
    setBackupDate(new Date().toISOString());
  };
  const applyImport = () => {
    try {
      const data = JSON.parse(importText);
      if (Array.isArray(data.zones)) setZones(data.zones);
      if (Array.isArray(data.cultures)) setCultures(data.cultures);
      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.harvests)) setHarvests(data.harvests);
      if (Array.isArray(data.journal)) setJournal(data.journal);
      if (Array.isArray(data.stocks)) setStocks(data.stocks);
      if (Array.isArray(data.seasons)) setSeasons(data.seasons);
      if (Array.isArray(data.seedlings)) setSeedlings(data.seedlings);
      if (Array.isArray(data.problems)) setProblems(data.problems);
    } catch {
      setImportText("JSON invalide : collez une sauvegarde PILOT POTAGER complète.");
    }
  };
  const runSync = async () => {
    const result = await syncToSupabase();
    setSyncMessage(result.message);
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm font-semibold text-garden-leaf">Conseil saisonnier</p><p className="mt-2 font-bold">{seasonalAdvice[currentMonth]}</p></Card>
        <Card><p className="text-sm font-semibold text-garden-leaf">Saisons</p><p className="mt-2 text-3xl font-black">{seasons.length}</p></Card>
        <Card><p className="text-sm font-semibold text-garden-leaf">Données exportées</p><p className="mt-2 text-3xl font-black">{Object.keys(snapshot).length - 1}</p>{backupDate && <p className="mt-1 text-xs font-semibold text-garden-leaf">Dernière sauvegarde : {formatDate(backupDate)}</p>}</Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black">Planning intelligent</h2>
          <p className="mt-2 text-sm text-garden-leaf">Génère des tâches à partir des cultures actives et de modèles locaux.</p>
          <Button className="mt-4" onClick={createPlanning}><Plus size={16} />Générer les tâches</Button>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Export / import</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={downloadExport}><Download size={16} />Exporter JSON</Button>
            <Button variant="secondary" onClick={() => setImportText(JSON.stringify(snapshot, null, 2))}><Upload size={16} />Prévisualiser import</Button>
            <Button variant="secondary" onClick={applyImport}>Importer</Button>
          </div>
          <textarea className={`${inputClass} mt-4 min-h-36 w-full font-mono text-xs`} value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Collez ici une sauvegarde JSON pour la prévisualiser." />
        </Card>
        <Card>
          <h2 className="text-xl font-black">Supabase prêt à brancher</h2>
          <p className="mt-2 text-sm text-garden-leaf">Le connecteur lit les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dès qu’elles existent.</p>
          <Button className="mt-4" variant="secondary" onClick={runSync}>Tester la synchro</Button>
          {syncMessage && <p className="mt-3 rounded-2xl bg-garden-cream p-3 text-sm font-semibold text-garden-leaf">{syncMessage}</p>}
        </Card>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Saisons et archive</h2>
            <p className="text-sm text-garden-leaf">Prépare le suivi année après année. L’archivage crée une nouvelle saison active.</p>
          </div>
          <Button variant="secondary" onClick={archiveSeason}>Archiver / nouvelle saison</Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {seasons.map((season) => <div key={season.id} className="rounded-2xl bg-garden-cream p-4"><Badge tone={season.status === "active" ? "green" : "gray"}>{season.status}</Badge><p className="mt-2 font-black">{season.name}</p><p className="text-sm text-garden-leaf">{season.notes}</p></div>)}
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-black">Rotation multi-saison</h2>
        <p className="mt-1 text-sm font-semibold text-garden-leaf">Saison active : {activeSeason?.name || "aucune"}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {zones.map((zone) => {
            const families = cultures.filter((culture) => culture.zone === zone.name).map((culture) => cropFamilies[culture.plant]).filter(Boolean);
            const repeated = families.find((family, index) => families.indexOf(family) !== index);
            return (
              <div key={zone.id} className="rounded-2xl bg-garden-cream p-4">
                <p className="font-black">{zone.name}</p>
                <p className="mt-1 text-sm text-garden-leaf">{families.join(", ") || "Aucune famille enregistrée"}</p>
                <Badge tone={repeated ? "amber" : "green"}>{repeated ? `Répétition ${repeated}` : "Rotation saine"}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-black">Historique des modifications</h2>
        <div className="mt-4 grid gap-2">
          {history.slice(0, 10).map((item) => (
            <div key={item.id} className="rounded-2xl bg-garden-cream p-3 text-sm">
              <span className="font-black">{formatDate(item.date)} · {item.type}</span>
              <p className="text-garden-leaf">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ZoneModal({ zones, setZones, editing, recordHistory, onClose }) {
  const [form, setForm] = useState(() => editing ? { ...editing, cultures: (editing.cultures ?? []).join(", ") } : { name: "", type: "Carré potager", exposure: "", size: "", notes: "", cultures: "" });
  return <Modal title={editing ? "Modifier la zone" : "Ajouter une zone"} onClose={onClose}><FormGrid submitLabel={editing ? "Mettre à jour" : "Enregistrer"} onSubmit={() => {
    const payload = { ...form, id: editing?.id ?? makeId("zone"), cultures: form.cultures.split(",").map((v) => v.trim()).filter(Boolean) };
    setZones(editing ? zones.map((zone) => zone.id === editing.id ? payload : zone) : [...zones, payload]);
    recordHistory?.("zone", `${editing ? "Modification" : "Création"} : ${payload.name}`);
    onClose();
  }}>
    <TextField label="Nom" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
    <SelectField label="Type" value={form.type} options={zoneTypes} onChange={(type) => setForm({ ...form, type })} />
    <TextField label="Exposition" value={form.exposure} onChange={(exposure) => setForm({ ...form, exposure })} />
    <TextField label="Surface ou volume" value={form.size} onChange={(size) => setForm({ ...form, size })} />
    <TextField label="Cultures associées" value={form.cultures} onChange={(cultures) => setForm({ ...form, cultures })} placeholder="Tomate, basilic..." />
    <TextArea label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
  </FormGrid></Modal>;
}

function CultureModal({ zones, cultures, setCultures, editing, draft, activeSeason, recordHistory, onClose }) {
  const [form, setForm] = useState(() => editing ?? { plant: "", variety: "", sowingDate: "", plantingDate: "", zone: zones[0]?.name ?? "", status: "bon", watering: "", nextAction: "", harvestDate: "", notes: "", ...draft });
  const applyVegetableCard = (plant) => {
    const card = vegetableCards.find((item) => item.name === plant);
    if (!card) {
      setForm({ ...form, plant });
      return;
    }
    setForm({
      ...form,
      plant,
      watering: card.water,
      nextAction: `Surveiller : ${card.diseases}`,
      notes: `Sol : ${card.soil}. Espacement : ${card.spacing}. Conseil : ${card.tips}`
    });
  };
  return <Modal title={editing ? "Modifier la culture" : "Ajouter une culture"} onClose={onClose}><FormGrid submitLabel={editing ? "Mettre à jour" : "Enregistrer"} onSubmit={() => {
    const payload = { ...form, id: editing?.id ?? makeId("culture"), seasonId: editing?.seasonId ?? activeSeason?.id, updatedAt: new Date().toISOString(), createdAt: editing?.createdAt ?? new Date().toISOString() };
    setCultures(editing ? cultures.map((culture) => culture.id === editing.id ? payload : culture) : [...cultures, payload]);
    recordHistory?.("culture", `${editing ? "Modification" : "Création"} : ${payload.plant} ${payload.variety}`.trim());
    onClose();
  }}>
    <Field label="Légume / fruit / aromate">
      <input className={inputClass} list="vegetable-list" value={form.plant} onChange={(event) => applyVegetableCard(event.target.value)} required />
      <datalist id="vegetable-list">{vegetableCards.map((card) => <option key={card.name} value={card.name} />)}</datalist>
    </Field>
    <TextField label="Variété" value={form.variety} onChange={(variety) => setForm({ ...form, variety })} />
    <TextField label="Date de semis" type="date" value={form.sowingDate} onChange={(sowingDate) => setForm({ ...form, sowingDate })} />
    <TextField label="Date de plantation" type="date" value={form.plantingDate} onChange={(plantingDate) => setForm({ ...form, plantingDate })} />
    <SelectField label="Zone" value={form.zone} options={zones.map((zone) => zone.name)} onChange={(zone) => setForm({ ...form, zone })} />
    <SelectField label="État" value={form.status} options={statuses} onChange={(status) => setForm({ ...form, status })} />
    <TextField label="Fréquence d’arrosage" value={form.watering} onChange={(watering) => setForm({ ...form, watering })} />
    <TextField label="Prochaine action" value={form.nextAction} onChange={(nextAction) => setForm({ ...form, nextAction })} />
    <TextField label="Date estimée de récolte" type="date" value={form.harvestDate} onChange={(harvestDate) => setForm({ ...form, harvestDate })} />
    <TextArea label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
  </FormGrid></Modal>;
}

function TaskModal({ zones, cultures, tasks, setTasks, editing, draft, activeSeason, recordHistory, onClose }) {
  const [form, setForm] = useState(() => editing ?? { title: "", priority: "moyenne", category: "arrosage", dueDate: draft?.dueDate ?? todayIso(), zone: zones[0]?.name ?? "", culture: cultures[0] ? `${cultures[0].plant} ${cultures[0].variety}` : "", completed: false });
  return <Modal title={editing ? "Modifier la tâche" : "Ajouter une tâche"} onClose={onClose}><FormGrid submitLabel={editing ? "Mettre à jour" : "Enregistrer"} onSubmit={() => {
    const payload = { ...form, id: editing?.id ?? makeId("task"), seasonId: editing?.seasonId ?? activeSeason?.id, updatedAt: new Date().toISOString(), createdAt: editing?.createdAt ?? new Date().toISOString() };
    setTasks(editing ? tasks.map((task) => task.id === editing.id ? payload : task) : [...tasks, payload]);
    recordHistory?.("tâche", `${editing ? "Modification" : "Création"} : ${payload.title}`);
    onClose();
  }}>
    <TextField label="Titre" value={form.title} onChange={(title) => setForm({ ...form, title })} required />
    <SelectField label="Priorité" value={form.priority} options={priorities} onChange={(priority) => setForm({ ...form, priority })} />
    <SelectField label="Catégorie" value={form.category} options={taskCategories} onChange={(category) => setForm({ ...form, category })} />
    <TextField label="Date prévue" type="date" value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
    <SelectField label="Zone liée" value={form.zone} options={zones.map((zone) => zone.name)} onChange={(zone) => setForm({ ...form, zone })} />
    <SelectField label="Culture liée" value={form.culture} options={cultures.map((culture) => `${culture.plant} ${culture.variety}`)} onChange={(culture) => setForm({ ...form, culture })} />
  </FormGrid></Modal>;
}

function HarvestModal({ zones, cultures, harvests, setHarvests, editing, activeSeason, recordHistory, onClose }) {
  const [form, setForm] = useState(() => editing ?? { culture: cultures[0] ? `${cultures[0].plant} ${cultures[0].variety}` : "", quantity: "", date: todayIso(), zone: zones[0]?.name ?? "", quality: "bonne", notes: "" });
  return <Modal title={editing ? "Modifier la récolte" : "Ajouter une récolte"} onClose={onClose}><FormGrid submitLabel={editing ? "Mettre à jour" : "Enregistrer"} onSubmit={() => {
    const payload = { ...form, id: editing?.id ?? makeId("harvest"), seasonId: editing?.seasonId ?? activeSeason?.id, updatedAt: new Date().toISOString(), createdAt: editing?.createdAt ?? new Date().toISOString() };
    setHarvests(editing ? harvests.map((harvest) => harvest.id === editing.id ? payload : harvest) : [...harvests, payload]);
    recordHistory?.("récolte", `${editing ? "Modification" : "Création"} : ${payload.culture} ${payload.quantity}`);
    onClose();
  }}>
    <SelectField label="Culture" value={form.culture} options={cultures.map((culture) => `${culture.plant} ${culture.variety}`)} onChange={(culture) => setForm({ ...form, culture })} />
    <TextField label="Quantité récoltée" value={form.quantity} onChange={(quantity) => setForm({ ...form, quantity })} required />
    <TextField label="Date" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
    <SelectField label="Zone" value={form.zone} options={zones.map((zone) => zone.name)} onChange={(zone) => setForm({ ...form, zone })} />
    <SelectField label="Qualité" value={form.quality} options={["faible", "moyenne", "bonne", "excellente"]} onChange={(quality) => setForm({ ...form, quality })} />
    <TextArea label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
  </FormGrid></Modal>;
}

function JournalModal({ zones, cultures, journal, setJournal, editing, activeSeason, recordHistory, onClose }) {
  const [form, setForm] = useState(() => editing ?? { date: todayIso(), culture: cultures[0] ? `${cultures[0].plant} ${cultures[0].variety}` : "", zone: zones[0]?.name ?? "", note: "", photo: "", observation: "", issue: "" });
  const loadPhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, photo: reader.result }));
    reader.readAsDataURL(file);
  };
  return <Modal title={editing ? "Modifier l’entrée photo" : "Ajouter une entrée photo"} onClose={onClose}><FormGrid submitLabel={editing ? "Mettre à jour" : "Enregistrer"} onSubmit={() => {
    const payload = { ...form, id: editing?.id ?? makeId("journal"), seasonId: editing?.seasonId ?? activeSeason?.id, updatedAt: new Date().toISOString(), createdAt: editing?.createdAt ?? new Date().toISOString() };
    setJournal(editing ? journal.map((entry) => entry.id === editing.id ? payload : entry) : [...journal, payload]);
    recordHistory?.("journal", `${editing ? "Modification" : "Création"} : ${payload.culture}`);
    onClose();
  }}>
    <TextField label="Date" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
    <SelectField label="Culture liée" value={form.culture} options={cultures.map((culture) => `${culture.plant} ${culture.variety}`)} onChange={(culture) => setForm({ ...form, culture })} />
    <SelectField label="Zone liée" value={form.zone} options={zones.map((zone) => zone.name)} onChange={(zone) => setForm({ ...form, zone })} />
    <Field label="Photo">
      <input className={inputClass} type="file" accept="image/*" capture="environment" onChange={(event) => loadPhoto(event.target.files?.[0])} />
      {form.photo && <img className="mt-2 h-28 w-full rounded-2xl object-cover" src={form.photo} alt="Aperçu" />}
    </Field>
    <TextField label="État observé" value={form.observation} onChange={(observation) => setForm({ ...form, observation })} />
    <TextField label="Problème éventuel" value={form.issue} onChange={(issue) => setForm({ ...form, issue })} />
    <TextArea label="Note" value={form.note} onChange={(note) => setForm({ ...form, note })} />
  </FormGrid></Modal>;
}

function FormGrid({ children, onSubmit, submitLabel = "Enregistrer" }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      <div className="flex justify-end">
        <Button type="submit"><Plus size={16} />{submitLabel}</Button>
      </div>
    </form>
  );
}

function TextField({ label, value, onChange, type = "text", ...props }) {
  return <Field label={label}><input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} {...props} /></Field>;
}

function TextArea({ label, value, onChange }) {
  return <Field label={label}><textarea className={`${inputClass} min-h-28 sm:col-span-2`} value={value} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function SelectField({ label, value, options, onChange }) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {!options.length && <option value="">Aucune option</option>}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  );
}
