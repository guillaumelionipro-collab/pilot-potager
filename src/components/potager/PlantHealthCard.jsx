import { CheckCircle2, Droplets, Sun, AlertTriangle, Sparkles, ShieldAlert } from "lucide-react";

// ── Premium AI diagnostic report card ───────────────────────────────────────
// Renders the structured "fiche complète" produced after a photo analysis:
// global health score (0-100, dynamic color), identification, general state,
// water need, exposure, detected diseases, urgency level and immediate advice.
//
// Tolerant of both the new "premium" fields (water_need, exposure, urgency,
// diseases, immediate_actions, scientific_name) and the legacy/demo result
// shape — sensible fallbacks are derived when a field is missing so older
// demo entries still render a coherent premium card.

const TONE_BY_LEVEL = { faible: "green", moyen: "amber", élevé: "red", "elevé": "red" };

function scoreTone(score = 0) {
  if (score >= 75) return { ring: "#3f9142", bg: "bg-emerald-50", text: "text-emerald-700", label: "Excellent" };
  if (score >= 50) return { ring: "#d99a2b", bg: "bg-amber-50", text: "text-amber-700", label: "À surveiller" };
  return { ring: "#dc4f4f", bg: "bg-red-50", text: "text-red-700", label: "Préoccupant" };
}

function pillTone(level) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-stone-100 text-stone-600 border-stone-200",
  };
  return tones[TONE_BY_LEVEL[level?.toLowerCase?.()] || "gray"] || tones.gray;
}

function deriveWaterNeed(result) {
  if (result.water_need) return result.water_need;
  const text = (result.watering_advice || "").toLowerCase();
  if (text.includes("abondant") || text.includes("régulier") || text.includes("gourmand")) return "élevé";
  if (text.includes("modéré") || text.includes("laisser sécher")) return "faible";
  return "moyen";
}

function deriveExposure(result) {
  return result.exposure || "soleil";
}

function deriveUrgency(result) {
  if (result.urgency) return result.urgency;
  const score = result.health_score ?? 70;
  if (score < 50) return "élevé";
  if (score < 75) return "moyen";
  return "faible";
}

function deriveDiseases(result) {
  if (Array.isArray(result.diseases) && result.diseases.length) return result.diseases;
  // fall back to possible_issues, capped, mapped to a moderate severity
  return (result.possible_issues || []).slice(0, 3).map((name) => ({ name, severity: "moyen" }));
}

function deriveImmediateActions(result) {
  if (Array.isArray(result.immediate_actions) && result.immediate_actions.length) return result.immediate_actions;
  return (result.recommended_actions || []).slice(0, 5).map((a) => a.title).filter(Boolean);
}

const EXPOSURE_LABEL = { soleil: "☀️ Plein soleil", "mi-ombre": "⛅ Mi-ombre", ombre: "🌥️ Ombre" };
const WATER_LABEL = { faible: "Faible", moyen: "Moyen", élevé: "Élevé", "elevé": "Élevé" };

// AI sometimes returns confidence as a 0–1 ratio (0.95) and sometimes already
// as a percentage (95) — normalize both to a clean 0–100 integer.
function confidencePercent(value) {
  const n = Number(value) || 0;
  const pct = n > 1 ? n : n * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export default function PlantHealthCard({ result, source }) {
  if (!result) return null;
  const score = Math.max(0, Math.min(100, Math.round(result.health_score ?? 0)));
  const tone = scoreTone(score);
  const waterNeed = deriveWaterNeed(result);
  const exposure = deriveExposure(result);
  const urgency = deriveUrgency(result);
  const diseases = deriveDiseases(result);
  const actions = deriveImmediateActions(result);
  const circumference = 2 * Math.PI * 42;
  const dash = (score / 100) * circumference;

  return (
    <div className="rounded-3xl overflow-hidden border border-garden-moss shadow-card bg-white">
      {/* Header / hero */}
      <div className="bg-gradient-to-br from-garden-pine to-garden-leaf px-6 py-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-black uppercase tracking-widest opacity-60">Fiche de diagnostic premium</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-black uppercase tracking-wider">
            <Sparkles size={10} /> Analyse IA
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          {/* Score ring */}
          <div className="relative flex h-24 w-24 items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="9" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black leading-none">{score}</span>
              <span className="text-[10px] font-bold opacity-70">/ 100</span>
            </div>
          </div>

          {/* Identification */}
          <div className="min-w-0">
            <p className="text-2xl font-black truncate">{result.plant_detected}</p>
            {result.scientific_name && <p className="text-sm italic opacity-70">{result.scientific_name}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${tone.bg} ${tone.text}`}>
                {tone.label} · {result.health_status || "—"}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
                Confiance {confidencePercent(result.confidence)} %
              </span>
              {result.growth_stage && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-xs font-bold capitalize">
                  {result.growth_stage}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick facts row */}
      <div className="grid grid-cols-3 divide-x divide-garden-moss border-b border-garden-moss bg-garden-cream/60">
        <Fact icon={<Droplets size={15} className="text-sky-600" />} label="Besoin en eau" value={WATER_LABEL[waterNeed?.toLowerCase?.()] || waterNeed} tone={pillTone(waterNeed)} />
        <Fact icon={<Sun size={15} className="text-amber-500" />} label="Exposition" value={EXPOSURE_LABEL[exposure?.toLowerCase?.()] || exposure} />
        <Fact icon={<ShieldAlert size={15} className="text-rose-500" />} label="Urgence" value={WATER_LABEL[urgency?.toLowerCase?.()] || urgency} tone={pillTone(urgency)} />
      </div>

      {/* Body */}
      <div className="px-6 py-5 grid gap-5">
        {/* Diseases / issues */}
        <Section title="🩺 Diagnostic maladies & problèmes">
          {diseases.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {diseases.map((d, i) => (
                <div key={i} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${pillTone(d.severity)}`}>
                  <span className="capitalize">{d.name}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-70">{d.severity}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <CheckCircle2 size={15} /> Aucun problème détecté sur cette photo — continuez ainsi !
            </p>
          )}
        </Section>

        {/* Immediate advice checklist */}
        <Section title="✅ Conseils immédiats">
          <ul className="grid gap-2">
            {actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-garden-cream px-3 py-2 text-sm font-semibold text-garden-pine">
                <CheckCircle2 size={15} className="text-garden-leaf mt-0.5 flex-shrink-0" /> {a}
              </li>
            ))}
            {!actions.length && <p className="text-sm text-garden-leaf">Aucune action urgente — surveillez régulièrement votre plante.</p>}
          </ul>
        </Section>

        {/* Observations */}
        {result.observations?.length > 0 && (
          <Section title="👁️ Observations détaillées">
            <ul className="grid gap-1.5">
              {result.observations.map((o, i) => (
                <li key={i} className="flex gap-2 text-sm text-garden-pine">
                  <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />{o}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Possible issues */}
        {result.possible_issues?.length > 0 && (
          <Section title="Points à surveiller">
            <ul className="grid gap-1.5">
              {result.possible_issues.map((issue, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />{issue}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Conseils */}
        <div className="grid sm:grid-cols-2 gap-3">
          {result.watering_advice && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-black text-blue-700 mb-1">💧 Arrosage</p>
              <p className="text-xs text-blue-800">{result.watering_advice}</p>
            </div>
          )}
          {result.fertilizer_advice && (
            <div className="rounded-xl bg-green-50 border border-green-100 p-3">
              <p className="text-xs font-black text-green-700 mb-1">🌱 Engrais</p>
              <p className="text-xs text-green-800">{result.fertilizer_advice}</p>
            </div>
          )}
        </div>

        {result.harvest_estimate && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <p className="text-xs font-black text-amber-700 mb-1">🌾 Récolte estimée</p>
            <p className="text-sm text-amber-800">{result.harvest_estimate}</p>
          </div>
        )}

        <p className="text-xs text-garden-sage">🔄 Prochain contrôle conseillé : <strong>{result.next_check || "dans quelques jours"}</strong></p>
      </div>
    </div>
  );
}

function Fact({ icon, label, value, tone }) {
  return (
    <div className="px-4 py-3 flex flex-col items-center text-center gap-1">
      <div className="flex items-center gap-1.5">{icon}<span className="text-[10px] font-black uppercase tracking-wider text-garden-leaf">{label}</span></div>
      <span className={`mt-0.5 inline-flex px-2.5 py-0.5 rounded-full text-xs font-black ${tone || "bg-white text-garden-pine border border-garden-moss"}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-garden-leaf border-b border-garden-moss pb-1">{title}</p>
      {children}
    </div>
  );
}
