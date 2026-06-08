import { useState, useMemo } from "react";
import { Search, X, ChevronDown, Leaf, Droplets, Sun, Ruler } from "lucide-react";
import { cultureLibrary, CATEGORIES, searchCultures, getCulturesByCategory } from "../../data/cultureLibrary";

const DIFFICULTY_STYLE = {
  facile:    "bg-green-50 text-green-700 ring-green-200",
  moyen:     "bg-amber-50 text-amber-700 ring-amber-200",
  difficile: "bg-red-50 text-red-700 ring-red-200",
};

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MONTHS_SOWING  = { bg: "bg-green-200",  label: "Semis" };
const MONTHS_PLANT   = { bg: "bg-garden-leaf/30", label: "Plantation" };
const MONTHS_HARVEST = { bg: "bg-garden-amber/40", label: "Récolte" };

function MonthBar({ months, color }) {
  return (
    <div className="flex gap-0.5">
      {MONTH_LABELS.map((m, i) => (
        <div key={i} title={m}
          className={`h-2 flex-1 rounded-sm ${months.includes(i + 1) ? color : "bg-gray-100"}`} />
      ))}
    </div>
  );
}

function DetailModal({ culture, onClose }) {
  const [tab, setTab] = useState("resume");
  const tabs = [
    { id: "resume",   label: "Résumé" },
    { id: "plant",    label: "Plantation" },
    { id: "care",     label: "Entretien" },
    { id: "disease",  label: "Maladies" },
    { id: "assoc",    label: "Associations" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-garden-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 rounded-t-3xl bg-garden-pine px-6 py-5 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition">
            <X size={16} />
          </button>
          <div className="text-4xl mb-2">{culture.emoji || "🌱"}</div>
          <h2 className="text-xl font-black">{culture.name}</h2>
          <p className="text-sm opacity-70">{culture.family}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ring-1 ${DIFFICULTY_STYLE[culture.difficulty]}`}>
              {culture.difficulty}
            </span>
            {culture.potFriendly && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/15">🪴 En pot</span>
            )}
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/15">~{culture.averageDaysToHarvest}j</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-garden-moss overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-bold transition ${
                tab === t.id
                  ? "text-garden-pine border-b-2 border-garden-pine"
                  : "text-garden-sage hover:text-garden-leaf"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="px-6 py-5 grid gap-4">

          {tab === "resume" && (
            <>
              <div className="grid sm:grid-cols-3 gap-3">
                <InfoChip icon={<Sun size={14} />} label="Exposition" value={culture.sunExposure} />
                <InfoChip icon={<Droplets size={14} />} label="Arrosage" value={culture.waterNeed} />
                <InfoChip icon={<Leaf size={14} />} label="Sol" value={culture.soilType} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <InfoChip icon={<Ruler size={14} />} label="Espacement" value={`${culture.spacingCm} cm`} />
                <InfoChip icon={<Ruler size={14} />} label="Hauteur" value={`${culture.adultHeightCm} cm`} />
              </div>
              {culture.potFriendly && culture.minimumPotVolumeLiters && (
                <div className="rounded-xl bg-garden-moss/40 px-4 py-3 text-sm text-garden-pine">
                  🪴 Volume minimum en pot : <strong>{culture.minimumPotVolumeLiters} L</strong>
                </div>
              )}
              <div className="grid gap-2">
                <SubTitle>Calendrier</SubTitle>
                <div className="grid gap-2 text-xs">
                  <div>
                    <p className="font-bold text-green-700 mb-1">Semis</p>
                    <MonthBar months={culture.sowingPeriod} color={MONTHS_SOWING.bg} />
                  </div>
                  <div>
                    <p className="font-bold text-garden-leaf mb-1">Plantation</p>
                    <MonthBar months={culture.plantingPeriod} color={MONTHS_PLANT.bg} />
                  </div>
                  <div>
                    <p className="font-bold text-garden-clay mb-1">Récolte</p>
                    <MonthBar months={culture.harvestPeriod} color={MONTHS_HARVEST.bg} />
                  </div>
                  <div className="flex gap-4 text-xs text-garden-sage mt-1">
                    {MONTH_LABELS.map((m, i) => (
                      <span key={i} className="flex-1 text-center">{i % 2 === 0 ? m : ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "plant" && (
            <>
              <InfoCard title="💡 Conseils de plantation">
                <p className="text-sm text-garden-pine leading-relaxed">
                  Planter après les saints de glace (mi-mai) pour les cultures sensibles au gel.
                  Respectez un espacement de <strong>{culture.spacingCm} cm</strong> entre les plants.
                </p>
              </InfoCard>
              {culture.wateringAdvice && (
                <InfoCard title="💧 Arrosage">
                  <p className="text-sm text-garden-pine leading-relaxed">{culture.wateringAdvice}</p>
                </InfoCard>
              )}
              {culture.fertilizerAdvice && (
                <InfoCard title="🌱 Engrais">
                  <p className="text-sm text-garden-pine leading-relaxed">{culture.fertilizerAdvice}</p>
                </InfoCard>
              )}
              {culture.potFriendly && (
                <InfoCard title="🪴 Culture en pot">
                  <p className="text-sm text-garden-pine">
                    Volume minimum : <strong>{culture.minimumPotVolumeLiters || "?"}L</strong>.<br />
                    Privilégiez un substrat riche et drainant. Arrosez plus fréquemment qu'en pleine terre.
                  </p>
                </InfoCard>
              )}
              {culture.keyActions?.length > 0 && (
                <>
                  <SubTitle>Actions clés</SubTitle>
                  <ul className="grid gap-2">
                    {culture.keyActions.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-garden-pine bg-garden-moss/30 rounded-xl px-3 py-2">
                        <span className="text-garden-leaf">✓</span>{a}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {tab === "care" && (
            <>
              {culture.pruningAdvice && (
                <InfoCard title="✂️ Taille & palissage">
                  <p className="text-sm text-garden-pine leading-relaxed">{culture.pruningAdvice}</p>
                </InfoCard>
              )}
              {culture.wateringAdvice && (
                <InfoCard title="💧 Arrosage">
                  <p className="text-sm text-garden-pine leading-relaxed">{culture.wateringAdvice}</p>
                </InfoCard>
              )}
              {culture.fertilizerAdvice && (
                <InfoCard title="🌱 Fertilisation">
                  <p className="text-sm text-garden-pine leading-relaxed">{culture.fertilizerAdvice}</p>
                </InfoCard>
              )}
              {culture.aiDiagnosisHints?.length > 0 && (
                <>
                  <SubTitle>Indices diagnostic IA</SubTitle>
                  <ul className="grid gap-1.5">
                    {culture.aiDiagnosisHints.map((h, i) => (
                      <li key={i} className="text-xs text-garden-leaf flex gap-2">
                        <span>🤖</span>{h}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {tab === "disease" && (
            <>
              {culture.commonDiseases?.length > 0 && (
                <>
                  <SubTitle>Maladies courantes</SubTitle>
                  <div className="flex flex-wrap gap-2">
                    {culture.commonDiseases.map((d, i) => (
                      <span key={i} className="px-2 py-1 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                        🦠 {d}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {culture.commonPests?.length > 0 && (
                <>
                  <SubTitle>Ravageurs fréquents</SubTitle>
                  <div className="flex flex-wrap gap-2">
                    {culture.commonPests.map((p, i) => (
                      <span key={i} className="px-2 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                        🐛 {p}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {(!culture.commonDiseases?.length && !culture.commonPests?.length) && (
                <p className="text-sm text-garden-sage text-center py-8">Aucune donnée de maladie disponible.</p>
              )}
            </>
          )}

          {tab === "assoc" && (
            <>
              {culture.goodCompanions?.length > 0 && (
                <>
                  <SubTitle>Bonnes associations 💚</SubTitle>
                  <div className="flex flex-wrap gap-2">
                    {culture.goodCompanions.map((c, i) => (
                      <span key={i} className="px-3 py-1 rounded-xl bg-green-50 text-green-700 text-sm font-bold border border-green-100">{c}</span>
                    ))}
                  </div>
                </>
              )}
              {culture.badCompanions?.length > 0 && (
                <>
                  <SubTitle>Mauvaises associations ❌</SubTitle>
                  <div className="flex flex-wrap gap-2">
                    {culture.badCompanions.map((c, i) => (
                      <span key={i} className="px-3 py-1 rounded-xl bg-red-50 text-red-700 text-sm font-bold border border-red-100">{c}</span>
                    ))}
                  </div>
                </>
              )}
              {(!culture.goodCompanions?.length && !culture.badCompanions?.length) && (
                <p className="text-sm text-garden-sage text-center py-8">Aucune donnée d'association disponible.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-garden-moss/30 px-3 py-2">
      <span className="text-garden-leaf">{icon}</span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-garden-sage">{label}</p>
        <p className="text-xs font-bold text-garden-pine capitalize">{value}</p>
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-xl border border-garden-moss bg-garden-paper/80 px-4 py-3">
      <p className="text-xs font-black text-garden-pine mb-2">{title}</p>
      {children}
    </div>
  );
}

function SubTitle({ children }) {
  return <p className="text-xs font-black uppercase tracking-wider text-garden-leaf border-b border-garden-moss pb-1">{children}</p>;
}

function CultureCard({ culture, onClick }) {
  return (
    <button onClick={() => onClick(culture)}
      className="text-left rounded-2xl border border-garden-moss bg-garden-paper/80 hover:bg-garden-paper hover:border-garden-leaf hover:shadow-card transition group p-4">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{culture.emoji || "🌱"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-garden-pine text-sm truncate">{culture.name}</p>
          <p className="text-xs text-garden-sage truncate">{culture.family}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ring-1 ${DIFFICULTY_STYLE[culture.difficulty]}`}>
              {culture.difficulty}
            </span>
            {culture.potFriendly && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-garden-moss/50 text-garden-pine">🪴 Pot</span>
            )}
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-garden-cream text-garden-sage">~{culture.averageDaysToHarvest}j</span>
          </div>
        </div>
        <ChevronDown size={14} className="text-garden-sage group-hover:text-garden-leaf transition rotate-[-90deg] flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default function CultureLibrary() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");
  const [potOnly, setPotOnly] = useState(false);
  const [selectedCulture, setSelectedCulture] = useState(null);

  const filtered = useMemo(() => {
    let list = query.trim() ? searchCultures(query) : (activeCategory === "all" ? cultureLibrary : getCulturesByCategory(activeCategory));
    if (diffFilter !== "all") list = list.filter((c) => c.difficulty === diffFilter);
    if (potOnly) list = list.filter((c) => c.potFriendly);
    return list;
  }, [query, activeCategory, diffFilter, potOnly]);

  return (
    <div className="grid gap-5">
      {/* ── Filters ── */}
      <div className="rounded-3xl border border-garden-moss bg-garden-paper/80 p-4 grid gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-sage" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une culture…"
            className="w-full pl-9 pr-9 py-2.5 rounded-2xl border border-garden-moss bg-white text-sm font-semibold text-garden-pine placeholder:text-garden-sage focus:outline-none focus:ring-2 focus:ring-garden-leaf" />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-garden-sage hover:text-garden-pine">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setActiveCategory("all"); setQuery(""); }}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition ${
              activeCategory === "all" && !query ? "bg-garden-pine text-white" : "bg-garden-moss/40 text-garden-pine hover:bg-garden-moss"
            }`}>
            Tout ({cultureLibrary.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = getCulturesByCategory(cat.id).length;
            return (
              <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setQuery(""); }}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition ${
                  activeCategory === cat.id && !query ? "bg-garden-pine text-white" : "bg-garden-moss/40 text-garden-pine hover:bg-garden-moss"
                }`}>
                {cat.emoji} {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Row 2 filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-black text-garden-sage uppercase tracking-wider">Difficulté :</span>
          {["all", "facile", "moyen", "difficile"].map((d) => (
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                diffFilter === d ? "bg-garden-pine text-white" : "bg-garden-cream text-garden-leaf hover:bg-garden-moss"
              }`}>
              {d === "all" ? "Toutes" : d}
            </button>
          ))}
          <button onClick={() => setPotOnly((v) => !v)}
            className={`ml-auto px-3 py-1 rounded-full text-xs font-bold transition ${
              potOnly ? "bg-garden-pine text-white" : "bg-garden-cream text-garden-leaf hover:bg-garden-moss"
            }`}>
            🪴 Pot seulement
          </button>
        </div>
      </div>

      {/* ── Results count ── */}
      <p className="text-sm text-garden-sage font-bold">
        {filtered.length} culture{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
      </p>

      {/* ── Grid ── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((c) => (
            <CultureCard key={c.id} culture={c} onClick={setSelectedCulture} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">🔍</span>
          <p className="font-bold text-garden-pine">Aucun résultat</p>
          <p className="text-sm text-garden-sage">Essayez d'autres termes ou retirez les filtres</p>
        </div>
      )}

      {/* ── Detail modal ── */}
      {selectedCulture && (
        <DetailModal culture={selectedCulture} onClose={() => setSelectedCulture(null)} />
      )}
    </div>
  );
}
