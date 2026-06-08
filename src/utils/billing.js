// Client-side helpers for the Freemium / Premium subscription model.
//
// Subscriptions are sold through Google Play Billing (Play Store) and managed
// via RevenueCat (https://www.revenuecat.com), which wraps the Play Billing
// Library, handles receipt validation server-side, and exposes a simple
// cross-platform purchase API through the `@revenuecat/purchases-capacitor`
// plugin. RevenueCat also fires webhooks that our `revenuecat-webhook` Supabase
// Edge Function uses to keep the `subscriptions` table in sync (entitlements,
// renewals, cancellations, billing issues...).
//
// Native purchases (Google Play) only work inside the Android app shell built
// with Capacitor — see /android. When the app runs in a regular browser (web
// preview, PWA, dev mode), Play Billing isn't available, so we fall back to a
// local "demo" plan toggle (`getLocalPlan` / `setLocalPlan`) so the Premium UI
// and quotas remain testable.

import { Capacitor } from "@capacitor/core";

const USAGE_KEY = "pilot-potager:ai-usage";
const PLAN_KEY = "pilot-potager:plan"; // local override, e.g. for demoing the Premium UI on web
const ENTITLEMENT_ID = "premium";

export const FREE_LIMITS = {
  aiAnalysesPerMonth: 10,
  maxCultures: 5,
};

export const PREMIUM_FEATURES = [
  "Analyses IA illimitées",
  "Assistant IA avancé",
  "Alertes intelligentes",
  "Historique complet",
  "Prévisions de récoltes",
  "Météo personnalisée",
  "Statistiques avancées",
  "Sauvegarde cloud",
];

export const PREMIUM_PRICE = { amount: 4.99, currency: "€", interval: "mois" };

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Local demo plan (web / dev fallback — Play Billing requires the Android app) ──

export function getLocalPlan() {
  return localStorage.getItem(PLAN_KEY) || "free"; // "free" | "premium"
}

export function setLocalPlan(plan) {
  localStorage.setItem(PLAN_KEY, plan);
}

// ── Usage quotas (free tier) ─────────────────────────────────────────────────

export function getAiUsage() {
  try {
    const stored = JSON.parse(localStorage.getItem(USAGE_KEY) || "{}");
    const period = currentPeriod();
    return { period, count: stored.period === period ? stored.count || 0 : 0 };
  } catch {
    return { period: currentPeriod(), count: 0 };
  }
}

export function recordAiUsage() {
  const period = currentPeriod();
  const usage = getAiUsage();
  const next = { period, count: usage.count + 1 };
  localStorage.setItem(USAGE_KEY, JSON.stringify(next));
  return next;
}

export function canRunAiAnalysis() {
  if (isPremium()) return { allowed: true, remaining: Infinity };
  const usage = getAiUsage();
  const remaining = Math.max(0, FREE_LIMITS.aiAnalysesPerMonth - usage.count);
  return { allowed: remaining > 0, remaining, used: usage.count, limit: FREE_LIMITS.aiAnalysesPerMonth };
}

// ── Google Play Billing via RevenueCat ───────────────────────────────────────

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function isBillingConfigured() {
  if (isNativeApp()) return Boolean(import.meta.env.VITE_REVENUECAT_PUBLIC_SDK_KEY);
  return Boolean(import.meta.env.VITE_BILLING_ENDPOINT) || true; // local demo always "works"
}

let _purchasesReady = null;
let _cachedCustomerInfo = null;

/**
 * Lazily configures the RevenueCat SDK (only meaningful inside the native
 * Android app — Play Billing is unavailable in a browser). Safe to call
 * multiple times; configuration happens once.
 */
async function ensurePurchasesConfigured() {
  if (!isNativeApp()) return false;
  if (_purchasesReady) return _purchasesReady;

  _purchasesReady = (async () => {
    const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_SDK_KEY;
    if (!apiKey) return false;
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
    try { await Purchases.setLogLevel({ level: LOG_LEVEL.WARN }); } catch { /* noop */ }
    await Purchases.configure({ apiKey });
    return true;
  })();

  return _purchasesReady;
}

/**
 * Refreshes and returns the RevenueCat CustomerInfo, used to determine whether
 * the "premium" entitlement is currently active (i.e. a valid Google Play
 * subscription exists for this user).
 */
export async function fetchCustomerInfo() {
  const ready = await ensurePurchasesConfigured();
  if (!ready) return null;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.getCustomerInfo();
    _cachedCustomerInfo = customerInfo;
    return customerInfo;
  } catch {
    return null;
  }
}

function entitlementIsActive(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
}

/**
 * Synchronous-ish premium check used throughout the UI. Inside the native app,
 * relies on the last known RevenueCat CustomerInfo (refreshed via
 * `refreshSubscriptionStatus`); falls back to the local demo plan elsewhere.
 */
export function isPremium() {
  if (isNativeApp() && _cachedCustomerInfo) return entitlementIsActive(_cachedCustomerInfo);
  return getLocalPlan() === "premium";
}

/**
 * Call on app start / Premium page mount to refresh the cached entitlement
 * status from RevenueCat (which itself talks to Google Play).
 */
export async function refreshSubscriptionStatus() {
  if (!isNativeApp()) return { ok: true, premium: getLocalPlan() === "premium", source: "local" };
  const info = await fetchCustomerInfo();
  if (!info) return { ok: false, premium: false, source: "revenuecat" };
  return { ok: true, premium: entitlementIsActive(info), source: "revenuecat" };
}

/**
 * Loads the current RevenueCat "Offerings" (Play Store products configured in
 * the RevenueCat dashboard, e.g. "pilot_premium_monthly").
 */
export async function getOfferings() {
  const ready = await ensurePurchasesConfigured();
  if (!ready) return null;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = await Purchases.getOfferings();
    return offerings?.current || null;
  } catch {
    return null;
  }
}

/**
 * Launches the native Google Play purchase flow for the Premium monthly plan
 * via RevenueCat. Returns { ok, premium, error?, message? }.
 */
export async function purchasePremium() {
  if (!isNativeApp()) {
    // Web / dev fallback — toggle the local demo plan so the UI is testable.
    setLocalPlan("premium");
    return { ok: true, premium: true, demo: true, message: "Mode démo (web) : Premium activé localement. Sur l'app Android, l'achat passe par Google Play." };
  }

  const ready = await ensurePurchasesConfigured();
  if (!ready) {
    return { ok: false, premium: false, error: "not_configured", message: "Le module de paiement Google Play n'est pas configuré (VITE_REVENUECAT_PUBLIC_SDK_KEY manquant)." };
  }

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const current = await getOfferings();
    const pkg = current?.availablePackages?.[0];
    if (!pkg) {
      return { ok: false, premium: false, error: "no_offering", message: "Aucune offre Premium disponible pour le moment. Réessayez plus tard." };
    }
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    _cachedCustomerInfo = customerInfo;
    const premium = entitlementIsActive(customerInfo);
    return { ok: true, premium, message: premium ? "Abonnement Premium activé ! 🎉" : "Achat enregistré, en attente de confirmation Google Play." };
  } catch (err) {
    if (err?.userCancelled) {
      return { ok: false, premium: false, error: "cancelled", message: "Achat annulé." };
    }
    return { ok: false, premium: false, error: "purchase_error", message: `Impossible de finaliser l'achat : ${err?.message || err}` };
  }
}

/**
 * Restores prior Google Play purchases (e.g. after a reinstall or a new
 * device) — required by Play Store policy for any subscription app.
 */
export async function restorePurchases() {
  if (!isNativeApp()) {
    return { ok: true, premium: getLocalPlan() === "premium", message: "Mode démo (web) : rien à restaurer." };
  }
  const ready = await ensurePurchasesConfigured();
  if (!ready) return { ok: false, premium: false, message: "Paiement Google Play non configuré." };
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.restorePurchases();
    _cachedCustomerInfo = customerInfo;
    const premium = entitlementIsActive(customerInfo);
    return { ok: true, premium, message: premium ? "Abonnement Premium restauré ✅" : "Aucun abonnement actif trouvé sur ce compte Google Play." };
  } catch (err) {
    return { ok: false, premium: false, message: `Échec de la restauration : ${err?.message || err}` };
  }
}

/**
 * Identifies the current user to RevenueCat (call once you know the Supabase
 * user id) so purchases are tied to the right account across devices.
 */
export async function loginRevenueCat(appUserId) {
  if (!isNativeApp() || !appUserId) return;
  const ready = await ensurePurchasesConfigured();
  if (!ready) return;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.logIn({ appUserID: appUserId });
    _cachedCustomerInfo = customerInfo;
  } catch { /* noop — stay anonymous */ }
}

/**
 * Where to manage / cancel the subscription — Google Play handles this
 * natively (Play Store > Abonnements), not our app.
 */
export const MANAGE_SUBSCRIPTION_URL = "https://play.google.com/store/account/subscriptions";
