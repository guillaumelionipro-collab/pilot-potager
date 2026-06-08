// Supabase Edge Function — "revenuecat-webhook"
//
// Receives subscription lifecycle events from RevenueCat (which itself wraps
// Google Play Billing — and Apple/Stripe if you ever enable them) and keeps
// the `subscriptions` table in sync (status: free | premium | cancelled | past_due).
//
// Why RevenueCat instead of talking to the Google Play Developer API directly?
//   - It validates Play Store purchase tokens server-side for you,
//   - normalises entitlement state across renewals/cancellations/refunds/
//     billing issues/upgrades,
//   - and sends a single, simple webhook format regardless of store.
//
// Deploy:
//   1. supabase functions deploy revenuecat-webhook --no-verify-jwt
//   2. supabase secrets set REVENUECAT_WEBHOOK_AUTH_TOKEN=<random-strong-secret>
//   3. supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   (service role — bypasses RLS)
//   4. In the RevenueCat dashboard → Project → Integrations → Webhooks, add:
//        URL:           https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook
//        Authorization: Bearer <same random-strong-secret as REVENUECAT_WEBHOOK_AUTH_TOKEN>
//
// Security: requests are rejected unless their Authorization header matches
// REVENUECAT_WEBHOOK_AUTH_TOKEN — this is the shared secret you configure on
// both sides (Supabase secret + RevenueCat webhook settings), since RevenueCat
// doesn't sign payloads the way Stripe does.
//
// App ⇄ RevenueCat user linking: the app calls `Purchases.logIn(supabaseUserId)`
// (see src/utils/billing.js → loginRevenueCat) so `event.app_user_id` below
// is the Supabase auth user id directly.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const authToken = Deno.env.get("REVENUECAT_WEBHOOK_AUTH_TOKEN") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, serviceKey);

const ENTITLEMENT_ID = "premium";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// Maps a RevenueCat event onto our internal subscription status.
function statusFromEvent(type: string): string | null {
  switch (type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
      return "premium";
    case "CANCELLATION":
      // The user cancelled but may still have access until period end —
      // RevenueCat will send EXPIRATION when access actually ends.
      return "cancelled";
    case "EXPIRATION":
      return "free";
    case "BILLING_ISSUE":
      return "past_due";
    default:
      return null; // TEST, TRANSFER, NON_RENEWING_PURCHASE, etc. — ignored
  }
}

async function upsertSubscription(userId: string, patch: Record<string, unknown>) {
  await supabase.from("subscriptions").upsert(
    { user_id: userId, ...patch },
    { onConflict: "user_id" }
  );
}

serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!authToken) return json({ ok: false, error: "missing_config", message: "REVENUECAT_WEBHOOK_AUTH_TOKEN non configuré." }, 500);

  const provided = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (provided !== authToken) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const event = body?.event;
  if (!event) return json({ ok: false, error: "missing_event" }, 400);

  // Only react to events for the entitlement we actually sell.
  const entitlements: string[] = event.entitlement_ids || (event.entitlement_id ? [event.entitlement_id] : []);
  if (entitlements.length && !entitlements.includes(ENTITLEMENT_ID)) {
    return json({ ok: true, ignored: true, reason: "other_entitlement" });
  }

  const userId: string | undefined = event.app_user_id || event.original_app_user_id;
  if (!userId || userId.startsWith("$RCAnonymousID:")) {
    // Purchase made before the app linked the RevenueCat identity to a
    // Supabase user — nothing to sync yet (will reconcile on next login/event).
    return json({ ok: true, ignored: true, reason: "anonymous_user" });
  }

  const status = statusFromEvent(event.type);
  if (!status) return json({ ok: true, ignored: true, reason: `event_${event.type}_not_mapped` });

  try {
    await upsertSubscription(userId, {
      status,
      plan: status === "premium" || status === "cancelled" || status === "past_due" ? "premium_monthly" : "free",
      store: event.store || "PLAY_STORE",
      revenuecat_app_user_id: userId,
      product_id: event.product_id,
      entitlement_id: ENTITLEMENT_ID,
      current_period_end: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
      cancel_at_period_end: event.type === "CANCELLATION",
      last_event_type: event.type,
      last_event_at: new Date().toISOString(),
    });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "db_error", message: `${err}` }, 500);
  }
});
