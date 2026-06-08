// Smart notifications — derives a contextual list of suggested alerts from the
// app's current data (tasks, cultures, harvests, journal). Pure & synchronous;
// the UI (notification bell) renders the resulting feed and can additionally
// push a native browser Notification for the most urgent item.

import { todayIso, formatDate } from "./storage";

const DAY = 86400000;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date(todayIso())) / DAY);
}

/**
 * @returns {{id:string, icon:string, title:string, detail:string, tone:"blue"|"green"|"amber"|"red", target:string}[]}
 */
export function buildNotifications({ tasks = [], cultures = [], journal = [], problems = [] }) {
  const items = [];
  const today = todayIso();

  // 💧 Watering reminders — tasks of category "arrosage" due today or overdue
  tasks
    .filter((t) => !t.completed && t.category === "arrosage" && t.dueDate <= today)
    .slice(0, 3)
    .forEach((t) => items.push({
      id: `water-${t.id}`,
      icon: "💧",
      title: "Arrosage conseillé",
      detail: `${t.title} · ${t.zone || "—"}`,
      tone: "blue",
      target: "Tâches",
    }));

  // 🍅 Upcoming harvests within 7 days
  cultures
    .filter((c) => c.harvestDate && daysUntil(c.harvestDate) !== null && daysUntil(c.harvestDate) >= 0 && daysUntil(c.harvestDate) <= 7)
    .slice(0, 3)
    .forEach((c) => items.push({
      id: `harvest-${c.id}`,
      icon: "🍅",
      title: "Récolte prévue",
      detail: `${c.plant} ${c.variety || ""} · ${formatDate(c.harvestDate)}`.trim(),
      tone: "green",
      target: "Récoltes",
    }));

  // ⚠️ Cultures to watch (status "à surveiller" or "malade")
  cultures
    .filter((c) => ["à surveiller", "malade"].includes(c.status))
    .slice(0, 3)
    .forEach((c) => items.push({
      id: `watch-${c.id}`,
      icon: "⚠️",
      title: "Culture à surveiller",
      detail: `${c.plant} ${c.variety || ""} · ${c.status}`.trim(),
      tone: c.status === "malade" ? "red" : "amber",
      target: "Mes cultures",
    }));

  // 📷 Suggest a follow-up photo if a culture hasn't had a journal entry in 10+ days
  cultures
    .filter((c) => c.status !== "terminé")
    .filter((c) => {
      const last = journal.filter((j) => j.culture === `${c.plant} ${c.variety}`.trim() || j.culture === c.plant)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!last) return true;
      return (new Date(today) - new Date(last.date)) / DAY >= 10;
    })
    .slice(0, 2)
    .forEach((c) => items.push({
      id: `photo-${c.id}`,
      icon: "📷",
      title: "Ajouter une photo de suivi",
      detail: `${c.plant} ${c.variety || ""} — pas de photo récente`.trim(),
      tone: "blue",
      target: "Journal photo",
    }));

  // 🌱 New planting opportunity — finished cultures free up a zone
  cultures
    .filter((c) => c.status === "terminé")
    .slice(0, 1)
    .forEach((c) => items.push({
      id: `replant-${c.id}`,
      icon: "🌱",
      title: "Nouvelle plantation possible",
      detail: `${c.zone || "Une zone"} est libre depuis la fin de "${c.plant}"`,
      tone: "green",
      target: "Mon potager",
    }));

  // ⚠️ Problems awaiting follow-up this week
  problems
    .filter((p) => p.followUpDate && daysUntil(p.followUpDate) !== null && daysUntil(p.followUpDate) <= 7 && daysUntil(p.followUpDate) >= 0)
    .slice(0, 2)
    .forEach((p) => items.push({
      id: `problem-${p.id}`,
      icon: "⚠️",
      title: "Suivi de traitement",
      detail: `${p.culture} · ${p.symptom}`,
      tone: "amber",
      target: "Problèmes",
    }));

  return items.slice(0, 12);
}
