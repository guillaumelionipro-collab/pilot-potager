import { Droplets, Scissors, FlaskConical, ShieldAlert, Bug, Clock, Sparkles } from "lucide-react";
import { Card, Badge } from "../ui.jsx";
import { formatDate, todayIso } from "../../utils/storage";

const CATEGORY_ICON = {
  arrosage: <Droplets size={14} className="text-sky-600" />,
  taille: <Scissors size={14} className="text-emerald-600" />,
  traitement: <FlaskConical size={14} className="text-amber-600" />,
};

const DAY = 86400000;
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date(todayIso())) / DAY);
}

// Picks a contextual daily tip based on what's happening in the garden right now.
function buildDailySuggestion({ cultures, watering }) {
  const fruiting = cultures.find((c) => /fructification/i.test(c.nextAction || "") || /tomate|courgette|concombre|poivron|aubergine/i.test(c.plant || ""));
  if (fruiting) {
    return `Vos ${fruiting.plant.toLowerCase()}s entrent en phase de fructification. Augmentez légèrement l'arrosage et ajoutez un engrais riche en potassium pour soutenir la production.`;
  }
  if (watering.length >= 3) {
    return "Plusieurs cultures réclament de l'eau aujourd'hui — privilégiez un arrosage matinal ou en soirée pour limiter l'évaporation et le stress thermique.";
  }
  const watch = cultures.find((c) => c.status === "à surveiller" || c.status === "malade");
  if (watch) {
    return `Gardez un œil sur "${watch.plant}" : son état est noté "${watch.status}". Une inspection rapprochée et un retrait des parties abîmées peuvent éviter une propagation.`;
  }
  return "Votre potager est stable aujourd'hui. Profitez-en pour planifier vos prochaines plantations et tenir votre journal photo à jour.";
}

export default function TodayInGarden({ tasks = [], cultures = [], problems = [], watering = [] }) {
  const today = todayIso();

  const todoToday = tasks
    .filter((t) => !t.completed && t.dueDate <= today && ["arrosage", "taille", "traitement"].includes(t.category))
    .slice(0, 6);

  const toWatch = [
    ...cultures.filter((c) => ["à surveiller", "malade"].includes(c.status)).map((c) => ({
      id: `c-${c.id}`, label: `${c.plant} ${c.variety || ""}`.trim(), detail: c.status, icon: <ShieldAlert size={14} className="text-amber-600" />,
    })),
    ...problems.filter((p) => p.followUpDate && daysUntil(p.followUpDate) >= 0 && daysUntil(p.followUpDate) <= 7).map((p) => ({
      id: `p-${p.id}`, label: p.culture, detail: p.symptom, icon: <Bug size={14} className="text-rose-600" />,
    })),
    ...cultures.filter((c) => c.harvestDate && daysUntil(c.harvestDate) !== null && daysUntil(c.harvestDate) < 0 && c.status !== "terminé").map((c) => ({
      id: `late-${c.id}`, label: `${c.plant} ${c.variety || ""}`.trim(), detail: "récolte en retard", icon: <Clock size={14} className="text-rose-600" />,
    })),
  ].slice(0, 6);

  const imminentHarvests = cultures
    .filter((c) => c.harvestDate && daysUntil(c.harvestDate) !== null && daysUntil(c.harvestDate) >= 0 && daysUntil(c.harvestDate) <= 7)
    .sort((a, b) => a.harvestDate.localeCompare(b.harvestDate))
    .slice(0, 5);

  const suggestion = buildDailySuggestion({ cultures, watering });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-black text-garden-pine flex items-center gap-2">🌱 Mon Potager Aujourd'hui</h2>
        <Badge tone="green">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* À faire aujourd'hui */}
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-garden-leaf">À faire aujourd'hui</p>
          <div className="grid gap-2">
            {todoToday.length ? todoToday.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-xl bg-garden-cream/70 px-3 py-2 text-sm">
                {CATEGORY_ICON[t.category] || <Droplets size={14} />}
                <span className="font-semibold text-garden-pine truncate">{t.title}</span>
              </div>
            )) : <p className="text-sm text-garden-leaf">Rien d'urgent — profitez-en pour observer votre jardin. 🌤️</p>}
          </div>
        </div>

        {/* À surveiller */}
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-garden-leaf">À surveiller</p>
          <div className="grid gap-2">
            {toWatch.length ? toWatch.map((w) => (
              <div key={w.id} className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-sm">
                {w.icon}
                <div className="min-w-0">
                  <p className="font-semibold text-garden-pine truncate">{w.label}</p>
                  <p className="text-[11px] text-garden-leaf truncate">{w.detail}</p>
                </div>
              </div>
            )) : <p className="text-sm text-garden-leaf">Aucune alerte — tout va bien ! ✅</p>}
          </div>
        </div>

        {/* Récoltes imminentes */}
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-garden-leaf">Récoltes imminentes (7 j)</p>
          <div className="grid gap-2">
            {imminentHarvests.length ? imminentHarvests.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm">
                <span className="font-semibold text-garden-pine truncate">{c.plant} {c.variety}</span>
                <Badge tone="green">{formatDate(c.harvestDate)}</Badge>
              </div>
            )) : <p className="text-sm text-garden-leaf">Pas de récolte prévue cette semaine.</p>}
          </div>
        </div>
      </div>

      {/* Suggestion IA */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-gradient-to-br from-garden-pine to-garden-leaf px-4 py-3.5 text-white">
        <Sparkles size={18} className="mt-0.5 flex-shrink-0 text-garden-amber" />
        <div>
          <p className="text-xs font-black uppercase tracking-wider opacity-70">Suggestion IA du jour</p>
          <p className="mt-1 text-sm leading-relaxed">{suggestion}</p>
        </div>
      </div>
    </Card>
  );
}
