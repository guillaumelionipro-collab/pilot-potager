import { useState } from "react";
import { X, Droplets, Zap, Calendar, AlertTriangle, CheckCircle, ChevronRight, Leaf } from "lucide-react";
import { myPlants, GARDEN_SCORE } from "../../data/potager/plants";
import { myActions } from "../../data/potager/actions";
import HealthBadge from "./HealthBadge";
import StageBadge from "./StageBadge";

const STATUS_STYLE = {
  excellent: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  bon:       "bg-green-50 text-green-700 border border-green-200",
  surveiller:"bg-amber-50 text-amber-700 border border-amber-200",
};

const NEED_BAR = {
  faible:   { width: "w-1/4",  color: "bg-garden-moss" },
  modéré:   { width: "w-1/2",  color: "bg-garden-sage" },
  régulier: { width: "w-3/4",  color: "bg-garden-leaf" },
  élevé:    { width: "w-full", color: "bg-garden-pine" },
};

function NeedBar({ label, value, icon }) {
  const style = NEED_BAR[value] || NEED_BAR["modéré"];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-garden-sage flex items-center gap-1">{icon}{label}</span>
        <span className="text-[10px] font-bold text-garden-leaf capitalize">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-garden-moss">
        <div className={`h-full rounded-full ${style.width} ${style.color} transition-all`} />
      </div>
    </div>
  );
}

function PlantDetailModal({ plant, onClose }) {
  const plantActions = myActions.filter((a) => a.plantId === plant.id && a.status !== "fait");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-garden-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 rounded-t-3xl px-6 py-5 text-white" style={{ background: plant.color }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition">
            <X size={16} />
          </button>
          <div className="text-5xl mb-3">{plant.emoji}</div>
          <h2 className="text-xl font-black">{plant.name}</h2>
          <p className="text-sm opacity-80">{plant.variety}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <HealthBadge score={plant.healthScore} size="lg" />
            <StageBadge stage={plant.stage} size="lg" />
            <span className="px-2 py-1 rounded-full bg-white/20 text-xs font-bold">{plant.location}</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid gap-5">
          {/* Besoins */}
          <div className="grid gap-3">
            <p className="text-xs font-black uppercase tracking-wider text-garden-leaf border-b border-garden-moss pb-1">Besoins</p>
            <NeedBar label="Arrosage" value={plant.waterNeed} icon={<Droplets size={10} />} />
            <NeedBar label="Engrais" value={plant.fertilizerNeed} icon={<Zap size={10} />} />
          </div>

          {/* Infos pot */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-garden-moss/40 px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-garden-sage">Emplacement</p>
              <p className="text-sm font-bold text-garden-pine mt-0.5">{plant.location}</p>
            </div>
            <div className="rounded-xl bg-garden-moss/40 px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-garden-sage">Volume pot</p>
              <p className="text-sm font-bold text-garden-pine mt-0.5">{plant.potVolumeLiters}L</p>
            </div>
            <div className="rounded-xl bg-garden-moss/40 px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-garden-sage">Planté le</p>
              <p className="text-sm font-bold text-garden-pine mt-0.5">{new Date(plant.plantedAt).toLocaleDateString("fr-FR", { day:"numeric", month:"long" })}</p>
            </div>
            <div className="rounded-xl bg-garden-moss/40 px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-garden-sage">Récolte estimée</p>
              <p className="text-sm font-bold text-garden-pine mt-0.5">{plant.harvestEstimate || "—"}</p>
            </div>
          </div>

          {/* Dernier diagnostic */}
          {plant.lastDiagnosis && (
            <div className="rounded-2xl border border-garden-moss bg-garden-paper/80 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-garden-leaf mb-2">Dernier diagnostic</p>
              <p className="text-sm text-garden-pine leading-relaxed">{plant.lastDiagnosis.summary}</p>
              <div className="flex items-center gap-2 mt-2">
                <HealthBadge score={plant.lastDiagnosis.healthScore} size="sm" />
                <span className="text-xs text-garden-sage">{new Date(plant.lastDiagnosis.date).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          )}

          {/* Risques */}
          {plant.keyRisks?.length > 0 && (
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-garden-leaf border-b border-garden-moss pb-1 mb-2">Risques à surveiller</p>
              <ul className="grid gap-1.5">
                {plant.keyRisks.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
                    <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions en attente */}
          {plantActions.length > 0 && (
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-garden-leaf border-b border-garden-moss pb-1 mb-2">Actions à faire</p>
              <ul className="grid gap-2">
                {plantActions.map((a) => (
                  <li key={a.id} className="flex gap-2 text-sm text-garden-pine bg-garden-moss/30 rounded-xl px-3 py-2">
                    <CheckCircle size={14} className="text-garden-leaf mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">{a.title}</p>
                      <p className="text-xs text-garden-sage">{a.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {plant.notes && (
            <div className="rounded-xl bg-garden-cream border border-garden-moss px-4 py-3">
              <p className="text-xs font-black text-garden-sage mb-1">Notes</p>
              <p className="text-sm text-garden-pine leading-relaxed">{plant.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlantCard({ plant, onClick }) {
  const urgentActions = myActions.filter((a) => a.plantId === plant.id && a.status === "à faire" && a.priority === "haute");

  return (
    <button onClick={() => onClick(plant)}
      className="text-left rounded-3xl overflow-hidden border border-white/60 bg-white/80 hover:bg-white hover:shadow-soft transition group shadow-card">
      {/* Color band */}
      <div className="h-2 w-full" style={{ background: plant.color }} />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{plant.emoji}</span>
            <div>
              <p className="font-black text-garden-pine text-sm leading-tight">{plant.name}</p>
              <p className="text-xs text-garden-sage leading-tight">{plant.variety}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-garden-sage group-hover:text-garden-leaf transition mt-1 flex-shrink-0" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <HealthBadge score={plant.healthScore} size="sm" />
          <StageBadge stage={plant.stage} size="sm" />
        </div>

        {/* Status */}
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-3 ${STATUS_STYLE[plant.status] || STATUS_STYLE.bon}`}>
          {plant.status === "excellent" ? "✓ Excellent" : plant.status === "bon" ? "✓ Bon état" : "⚠ À surveiller"}
        </span>

        {/* Next action */}
        {plant.nextAction && (
          <p className="text-xs text-garden-leaf bg-garden-moss/40 rounded-xl px-2.5 py-1.5 leading-relaxed">
            → {plant.nextAction}
          </p>
        )}

        {/* Urgent alert */}
        {urgentActions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-red-600 bg-red-50 rounded-lg px-2 py-1">
            <AlertTriangle size={10} />
            {urgentActions.length} action{urgentActions.length > 1 ? "s" : ""} urgente{urgentActions.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </button>
  );
}

export default function MyPlants() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const filters = [
    { id: "all",       label: "Toutes" },
    { id: "surveiller",label: "À surveiller" },
    { id: "excellent", label: "Excellentes" },
  ];

  const filtered = filter === "all" ? myPlants : myPlants.filter((p) => p.status === filter);

  const avgScore = Math.round(myPlants.reduce((s, p) => s + p.healthScore, 0) / myPlants.length);
  const urgentCount = myActions.filter((a) => a.status === "à faire" && a.priority === "haute").length;
  const surveiller = myPlants.filter((p) => p.status === "surveiller").length;

  return (
    <div className="grid gap-6">
      {/* Stats band */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Score potager" value={`${GARDEN_SCORE}/100`} accent="text-garden-pine" bg="bg-garden-pine/8" emoji="🌿" />
        <StatCard label="Santé moyenne" value={`${avgScore}/100`} accent="text-emerald-700" bg="bg-emerald-50" emoji="❤️" />
        <StatCard label="Actions urgentes" value={urgentCount} accent="text-red-600" bg="bg-red-50" emoji="⚡" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition ${
              filter === f.id ? "bg-garden-pine text-white" : "bg-white/80 text-garden-leaf hover:bg-garden-moss/60 border border-garden-moss"
            }`}>
            {f.label}
          </button>
        ))}
        {surveiller > 0 && (
          <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            ⚠ {surveiller} plante{surveiller > 1 ? "s" : ""} à surveiller
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((plant) => (
          <PlantCard key={plant.id} plant={plant} onClick={setSelected} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Leaf size={40} className="text-garden-sage" />
          <p className="font-bold text-garden-pine">Aucune plante dans cette catégorie</p>
        </div>
      )}

      {selected && <PlantDetailModal plant={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatCard({ label, value, accent, bg, emoji }) {
  return (
    <div className={`rounded-2xl ${bg} border border-white/60 px-4 py-3 shadow-card`}>
      <p className="text-lg mb-0.5">{emoji}</p>
      <p className={`text-xl font-black ${accent}`}>{value}</p>
      <p className="text-xs text-garden-sage font-bold">{label}</p>
    </div>
  );
}
