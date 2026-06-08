// Supabase client + authentication helpers.
//
// Pilot Potager runs fully offline-first (all garden data lives in
// localStorage), but a Supabase account unlocks cloud backup, multi-device
// sync, and is required to reliably link a Google Play Premium subscription
// to a user (RevenueCat needs a stable `app_user_id` — see utils/billing.js
// → loginRevenueCat).

import { createClient } from "@supabase/supabase-js";

export function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    enabled: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
  };
}

let _client = null;

/** Returns a singleton Supabase client, or null if not configured. */
export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.enabled) return null;
  if (!_client) {
    _client = createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return _client;
}

export function isAuthConfigured() {
  return getSupabaseConfig().enabled;
}

// ── Session helpers ──────────────────────────────────────────────────────────

export async function getSession() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data?.session || null;
}

/** Subscribes to auth state changes; returns an unsubscribe function. */
export function onAuthStateChange(callback) {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data?.subscription?.unsubscribe?.();
}

function friendlyAuthError(message = "") {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cet e-mail — essayez de vous connecter.";
  if (m.includes("password should be at least")) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("email not confirmed")) return "Confirmez votre e-mail (lien envoyé à votre adresse) avant de vous connecter.";
  if (m.includes("rate limit")) return "Trop de tentatives — réessayez dans quelques minutes.";
  return message || "Une erreur est survenue.";
}

export async function signUpWithEmail(email, password, displayName) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase n'est pas configuré." };
  const { data, error } = await client.auth.signUp({
    email, password,
    options: { data: displayName ? { display_name: displayName } : undefined },
  });
  if (error) return { ok: false, message: friendlyAuthError(error.message) };
  const needsConfirmation = !data?.session;
  return { ok: true, session: data?.session || null, needsConfirmation };
}

export async function signInWithEmail(email, password) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase n'est pas configuré." };
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: friendlyAuthError(error.message) };
  return { ok: true, session: data?.session || null };
}

export async function signInWithMagicLink(email) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase n'est pas configuré." };
  const { error } = await client.auth.signInWithOtp({ email });
  if (error) return { ok: false, message: friendlyAuthError(error.message) };
  return { ok: true, message: "Lien de connexion envoyé — consultez votre boîte mail." };
}

export async function sendPasswordReset(email) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase n'est pas configuré." };
  const { error } = await client.auth.resetPasswordForEmail(email);
  if (error) return { ok: false, message: friendlyAuthError(error.message) };
  return { ok: true, message: "E-mail de réinitialisation envoyé." };
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return { ok: false };
  await client.auth.signOut();
  return { ok: true };
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/** Quick reachability check used in the Settings / debug views. */
export async function syncToSupabase() {
  const config = getSupabaseConfig();
  if (!config.enabled) {
    return { ok: false, message: "Supabase n'est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY." };
  }
  try {
    const client = getSupabaseClient();
    const { error } = await client.from("subscriptions").select("id").limit(1);
    if (error) {
      return { ok: false, message: `Supabase joignable, table à créer ou droits à ajuster : ${error.message}` };
    }
    return { ok: true, message: "Supabase est configuré et joignable." };
  } catch (error) {
    return { ok: false, message: `Supabase non disponible : ${error.message}` };
  }
}
