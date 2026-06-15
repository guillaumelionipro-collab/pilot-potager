import { useEffect, useState } from "react";
import { Check, Sparkles, Loader, Crown, ShieldCheck, RefreshCw } from "lucide-react";
import { Card, Button } from "../ui.jsx";
import {
  PREMIUM_FEATURES, PREMIUM_PRICE, PREMIUM_PRICE_ANNUAL, FREE_LIMITS,
  isPremium, getAiUsage,
  isNativeApp, purchasePremium, restorePurchases, refreshSubscriptionStatus,
  MANAGE_SUBSCRIPTION_URL,
} from "../../utils/billing";

const FREE_FEATURES = [
  `${FREE_LIMITS.aiAnalysesPerMonth} analyses IA / mois`,
  "Calendrier simple",
  `${FREE_LIMITS.maxCultures} cultures maximum`,
  "Suivi de base des tâches et récoltes",
];

export default function PremiumPage() {
  const [premium, setPremium] = useState(isPremium());
  const [billingPeriod, setBillingPeriod] = useState("annual"); // "monthly" | "annual"
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState(null);
  const usage = getAiUsage();
  const native = isNativeApp();

  useEffect(() => {
    let cancelled = false;
    refreshSubscriptionStatus().then((res) => {
      if (!cancelled && res.ok) setPremium(res.premium);
    });
    return () => { cancelled = true; };
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    setMessage(null);
    const result = await purchasePremium();
    setLoading(false);
    setPremium(result.premium || isPremium());
    if (result.demo) {
      setMessage({ tone: "green", text: result.message });
    } else if (result.ok) {
      setMessage({ tone: "green", text: result.message || "Abonnement Premium activé via Google Play 🎉" });
    } else if (result.error === "cancelled") {
      setMessage({ tone: "gray", text: result.message });
    } else {
      setMessage({ tone: "amber", text: result.message || "Le paiement Google Play n'a pas pu être lancé." });
    }
  }

  async function handleRestore() {
    setRestoring(true);
    setMessage(null);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.ok) setPremium(result.premium);
    setMessage({ tone: result.premium ? "green" : "gray", text: result.message });
  }

  return (
    <div className="grid gap-6">
      {/* Hero */}
      <Card className="overflow-hidden bg-gradient-to-br from-garden-pine to-garden-leaf text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wider">
              <Crown size={13} /> Pilot Premium
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black">Cultivez sans limites 🌿</h1>
            <p className="mt-2 max-w-xl text-white/85 text-sm">
              Débloquez l'assistant IA avancé, les analyses illimitées, les prévisions de récolte
              et les statistiques détaillées pour faire de votre potager un vrai succès.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white/70">
              <ShieldCheck size={14} /> Paiement sécurisé via Google Play — facturation et annulation gérées par votre compte Google
            </p>
          </div>
          <Sparkles className="h-16 w-16 text-garden-amber flex-shrink-0 hidden sm:block" />
        </div>
      </Card>

      {message && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
          message.tone === "green" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
          message.tone === "amber" ? "bg-amber-50 text-amber-800 border border-amber-200" :
          "bg-stone-100 text-stone-700 border border-stone-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Free */}
        <Card className={premium ? "opacity-70" : "ring-2 ring-garden-moss"}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-garden-pine">Version gratuite</h2>
            <span className="rounded-full bg-garden-moss px-3 py-1 text-xs font-black text-garden-pine">0 € / mois</span>
          </div>
          <p className="mt-1 text-sm text-garden-leaf">Idéal pour démarrer et suivre un petit potager.</p>
          <ul className="mt-4 grid gap-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-garden-pine">
                <Check size={16} className="text-garden-leaf mt-0.5 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-garden-cream px-4 py-3 text-xs text-garden-leaf">
            Analyses IA utilisées ce mois-ci : <strong className="text-garden-pine">{usage.count} / {FREE_LIMITS.aiAnalysesPerMonth}</strong>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-garden-leaf" style={{ width: `${Math.min(100, (usage.count / FREE_LIMITS.aiAnalysesPerMonth) * 100)}%` }} />
            </div>
          </div>
        </Card>

        {/* Premium */}
        <Card className={`relative overflow-hidden ${premium ? "ring-2 ring-garden-amber" : "border-2 border-garden-pine"}`}>
          <span className="absolute -right-10 top-5 rotate-45 bg-garden-amber px-12 py-1 text-[10px] font-black uppercase tracking-widest text-garden-pine shadow">
            Recommandé
          </span>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-garden-pine flex items-center gap-2"><Crown size={18} className="text-garden-amber" /> Premium</h2>
            {premium && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Actif</span>}
          </div>
          {/* Monthly / annual toggle */}
          <div className="mt-3 inline-flex rounded-xl border border-garden-moss bg-garden-paper/60 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`rounded-lg px-3 py-1.5 transition ${billingPeriod === "monthly" ? "bg-garden-pine text-white" : "text-garden-pine"}`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("annual")}
              className={`relative rounded-lg px-3 py-1.5 transition ${billingPeriod === "annual" ? "bg-garden-pine text-white" : "text-garden-pine"}`}
            >
              Annuel
              <span className="absolute -top-3 -right-2 rounded-full bg-garden-amber px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-garden-pine shadow">
                ⭐ Recommandé
              </span>
            </button>
          </div>

          {billingPeriod === "annual" ? (
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-black text-garden-pine">{PREMIUM_PRICE_ANNUAL.amount.toString().replace(".", ",")} {PREMIUM_PRICE_ANNUAL.currency}</span>
              <span className="text-sm font-semibold text-garden-leaf">/ {PREMIUM_PRICE_ANNUAL.interval}</span>
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">2 mois offerts</span>
            </p>
          ) : (
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-black text-garden-pine">{PREMIUM_PRICE.amount.toString().replace(".", ",")} {PREMIUM_PRICE.currency}</span>
              <span className="text-sm font-semibold text-garden-leaf">/ {PREMIUM_PRICE.interval}</span>
            </p>
          )}
          <p className="mt-1 text-sm text-garden-leaf">Sans engagement — annulable à tout moment depuis Google Play.</p>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm font-semibold text-garden-pine">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-garden-pine text-white flex-shrink-0">
                  <Check size={12} />
                </span>
                {f}
              </li>
            ))}
          </ul>
          {!premium ? (
            <Button className="mt-6 w-full text-base py-3.5" onClick={handleUpgrade} disabled={loading}>
              {loading ? <><Loader size={18} className="animate-spin" /> Connexion à Google Play…</> : <><Crown size={18} /> Passer Premium</>}
            </Button>
          ) : (
            <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-800 text-center">
              ✨ Vous profitez déjà de Pilot Premium — merci de votre confiance !
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={handleRestore} disabled={restoring}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-garden-pine underline decoration-garden-moss underline-offset-2 disabled:opacity-50">
              {restoring ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />} Restaurer mes achats
            </button>
            {premium && native && (
              <a href={MANAGE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-garden-pine underline decoration-garden-moss underline-offset-2">
                Gérer mon abonnement sur Google Play
              </a>
            )}
          </div>

          <p className="mt-3 text-[11px] text-garden-sage">
            Abonnement géré par <strong>Google Play</strong>. Facturation récurrente, annulable à tout moment depuis
            votre compte Google.
          </p>
          {!native && (
            <p className="mt-1 text-[11px] text-garden-sage">
              L'achat se fait depuis l'application Android — téléchargez Pilot Potager sur Google Play pour passer Premium.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
