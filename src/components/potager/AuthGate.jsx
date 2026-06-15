import { useState } from "react";
import { Leaf, Mail, Lock, User, Loader, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Button, Field, inputClass } from "../ui.jsx";
import { signUpWithEmail, signInWithEmail, signInWithMagicLink, sendPasswordReset } from "../../utils/supabaseClient";

const MODES = {
  signin: { title: "Bon retour 🌱", cta: "Se connecter", switchLabel: "Pas encore de compte ?", switchCta: "Créer un compte" },
  signup: { title: "Créez votre compte jardinier", cta: "Créer mon compte", switchLabel: "Déjà inscrit ?", switchCta: "Se connecter" },
};

/**
 * Full-screen authentication gate shown when Supabase Auth is configured and
 * no session is active. Supports email+password sign up / sign in, a
 * magic-link fallback, and password reset. On success, calls `onAuthenticated`
 * with the new Supabase session.
 */
export default function AuthGate({ onAuthenticated }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const copy = MODES[mode];

  function toggleMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setFeedback(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFeedback({ tone: "amber", text: "Renseignez votre e-mail et votre mot de passe." });
      return;
    }
    setLoading(true);
    setFeedback(null);

    const result = mode === "signup"
      ? await signUpWithEmail(email.trim(), password, name.trim())
      : await signInWithEmail(email.trim(), password);

    setLoading(false);

    if (!result.ok) {
      setFeedback({ tone: "red", text: result.message });
      return;
    }
    if (mode === "signup" && result.needsConfirmation) {
      setFeedback({ tone: "green", text: "Compte créé 🎉 Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous." });
      setMode("signin");
      return;
    }
    if (result.session) onAuthenticated(result.session);
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setFeedback({ tone: "amber", text: "Indiquez votre e-mail pour recevoir un lien de connexion." });
      return;
    }
    setLoading(true);
    const result = await signInWithMagicLink(email.trim());
    setLoading(false);
    setFeedback({ tone: result.ok ? "green" : "red", text: result.message });
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setFeedback({ tone: "amber", text: "Indiquez votre e-mail pour réinitialiser votre mot de passe." });
      return;
    }
    setLoading(true);
    const result = await sendPasswordReset(email.trim());
    setLoading(false);
    setFeedback({ tone: result.ok ? "green" : "red", text: result.message });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-garden-pine via-garden-pine to-garden-leaf px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-card">
            <Leaf size={28} />
          </div>
          <p className="mt-3 text-lg font-black tracking-wide">PILOT POTAGER</p>
          <p className="text-sm text-white/75 font-semibold">Votre carnet de culture intelligent</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h1 className="text-xl font-black text-garden-pine">{copy.title}</h1>
          <p className="mt-1 text-sm text-garden-leaf">
            {mode === "signup"
              ? "Sauvegardez votre potager dans le cloud, synchronisez vos appareils et gardez votre abonnement Premium lié à votre compte."
              : "Retrouvez votre potager, vos analyses IA et votre abonnement Premium."}
          </p>

          {feedback && (
            <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
              feedback.tone === "green" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
              feedback.tone === "amber" ? "bg-amber-50 text-amber-800 border border-amber-200" :
              "bg-rose-50 text-rose-700 border border-rose-200"
            }`}>
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 grid gap-3.5">
            {mode === "signup" && (
              <Field label="Votre prénom">
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-garden-sage" />
                  <input className={`${inputClass} pl-9 w-full`} placeholder="Camille" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
                </div>
              </Field>
            )}
            <Field label="Adresse e-mail">
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-garden-sage" />
                <input type="email" required className={`${inputClass} pl-9 w-full`} placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </Field>
            <Field label="Mot de passe">
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-garden-sage" />
                <input type="password" required className={`${inputClass} pl-9 w-full`} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} />
              </div>
            </Field>

            <Button type="submit" disabled={loading} className="mt-1 w-full text-base py-3">
              {loading ? <><Loader size={18} className="animate-spin" /> Un instant…</> : <>{copy.cta} <ArrowRight size={16} /></>}
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <button onClick={handleMagicLink} disabled={loading} className="text-garden-pine underline decoration-garden-moss underline-offset-2 disabled:opacity-50">
              Recevoir un lien de connexion par e-mail
            </button>
            {mode === "signin" && (
              <button onClick={handleForgotPassword} disabled={loading} className="text-garden-sage underline decoration-garden-moss underline-offset-2 disabled:opacity-50">
                Mot de passe oublié ?
              </button>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-garden-sage">
            <span className="h-px flex-1 bg-garden-moss" /> ou <span className="h-px flex-1 bg-garden-moss" />
          </div>

          <button onClick={toggleMode} className="mt-4 w-full rounded-xl border border-garden-moss px-4 py-2.5 text-sm font-bold text-garden-pine hover:bg-garden-moss/40 transition">
            {copy.switchLabel} <span className="text-garden-leaf">{copy.switchCta}</span>
          </button>

          <p className="mt-5 flex items-start gap-2 text-[11px] text-garden-sage">
            <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
            Vos données restent privées : elles sont chiffrées en transit et ne sont jamais partagées. Vous pouvez les exporter ou supprimer votre compte à tout moment depuis les Paramètres.
          </p>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs font-bold text-white/70">
          <Sparkles size={13} /> Astuce : votre abonnement Pilot Premium reste lié à votre compte, même si vous changez de téléphone.
        </p>
      </div>
    </div>
  );
}
