import { useMemo } from "react";
import { Sprout, Wheat, Scale, Target, Camera, CalendarClock } from "lucide-react";
import { Card } from "../ui.jsx";
import { todayIso } from "../../utils/storage";

function parseQty(value = "") {
  const n = Number.parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(n)) return 0;
  const v = String(value).toLowerCase();
  if (v.includes("kg")) return n * 1000;
  return n; // assume grams
}

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export default function Statistics({ cultures = [], harvests = [], tasks = [], journal = [], history = [] }) {
  const stats = useMemo(() => {
    const totalCultures = cultures.length;
    const finished = cultures.filter((c) => c.status === "terminé");
    const succeeded = finished.filter((c) => c.status !== "malade");
    const successRate = finished.length ? Math.round((succeeded.length / finished.length) * 100) : (totalCultures ? 100 : 0);
    const totalWeight = harvests.reduce((sum, h) => sum + parseQty(h.quantity), 0);
    const aiAnalyses = history.filter((h) => h.type === "ai" || /analyse/i.test(h.label || "")).length;
    const followUpDays = new Set(history.map((h) => h.date)).size;

    // Harvest weight per month (last 6 months incl. current)
    const now = new Date(todayIso());
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], weight: 0 };
    });
    harvests.forEach((h) => {
      if (!h.date) return;
      const d = new Date(h.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.weight += parseQty(h.quantity);
    });

    // Cultures by status (for a simple distribution bar)
    const statusOrder = ["bon", "à surveiller", "malade", "terminé"];
    const byStatus = statusOrder.map((status) => ({
      status,
      count: cultures.filter((c) => c.status === status).length,
    }));

    return { totalCultures, totalWeight, successRate, aiAnalyses, followUpDays, buckets, byStatus, harvestsCount: harvests.length };
  }, [cultures, harvests, tasks, journal, history]);

  const maxWeight = Math.max(1, ...stats.buckets.map((b) => b.weight));
  const maxStatus = Math.max(1, ...stats.byStatus.map((b) => b.count));
  const STATUS_COLOR = { bon: "bg-emerald-500", "à surveiller": "bg-amber-500", malade: "bg-rose-500", "terminé": "bg-stone-400" };

  const cards = [
    { label: "Cultures suivies", value: stats.totalCultures, icon: <Sprout size={18} className="text-emerald-600" /> },
    { label: "Récoltes totales", value: stats.harvestsCount, icon: <Wheat size={18} className="text-amber-600" /> },
    { label: "Poids récolté", value: `${(stats.totalWeight / 1000).toFixed(1)} kg`, icon: <Scale size={18} className="text-sky-600" /> },
    { label: "Taux de réussite", value: `${stats.successRate}%`, icon: <Target size={18} className="text-rose-600" /> },
    { label: "Analyses IA réalisées", value: stats.aiAnalyses, icon: <Camera size={18} className="text-violet-600" /> },
    { label: "Jours de suivi", value: stats.followUpDays, icon: <CalendarClock size={18} className="text-garden-pine" /> },
  ];

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-garden-leaf">{c.icon}{c.label}</div>
            <p className="mt-2 text-3xl font-black text-garden-pine">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Harvest weight bar chart */}
        <Card>
          <h2 className="text-lg font-black text-garden-pine mb-4">Récoltes (poids) — 6 derniers mois</h2>
          <div className="flex items-end gap-3 h-44">
            {stats.buckets.map((b) => (
              <div key={b.key} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-garden-pine to-garden-leaf transition-all"
                    style={{ height: `${Math.max(4, (b.weight / maxWeight) * 100)}%` }}
                    title={`${(b.weight / 1000).toFixed(2)} kg`}
                  />
                </div>
                <p className="text-xs font-bold text-garden-leaf">{b.label}</p>
                <p className="text-[11px] text-garden-sage">{(b.weight / 1000).toFixed(1)} kg</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Culture status distribution */}
        <Card>
          <h2 className="text-lg font-black text-garden-pine mb-4">Répartition des cultures par état</h2>
          <div className="grid gap-3">
            {stats.byStatus.map((b) => (
              <div key={b.status}>
                <div className="flex items-center justify-between text-sm font-semibold text-garden-pine mb-1">
                  <span className="capitalize">{b.status}</span>
                  <span>{b.count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-garden-cream overflow-hidden">
                  <div className={`h-full rounded-full ${STATUS_COLOR[b.status]}`} style={{ width: `${(b.count / maxStatus) * 100}%` }} />
                </div>
              </div>
            ))}
            {!stats.totalCultures && <p className="text-sm text-garden-leaf">Ajoutez des cultures pour voir vos statistiques.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
