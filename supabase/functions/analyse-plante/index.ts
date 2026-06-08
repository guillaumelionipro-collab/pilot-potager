// Supabase Edge Function — "analyse-plante"
// Secure server-side proxy for the Premium AI plant photo diagnosis.
//
// Why this exists: calling OpenAI directly from the browser exposes the API key
// to anyone inspecting network requests — unacceptable for a public Play Store app.
// This function runs server-side, holds OPENAI_API_KEY as a secret, and returns a
// structured "Premium" diagnostic report. The client never sees the OpenAI key.
//
// Deploy:
//   1. supabase functions deploy analyse-plante
//   2. supabase secrets set OPENAI_API_KEY=sk-your-real-key
//   3. In the app's .env (or hosting env), set:
//        VITE_PLANT_VISION_ENDPOINT=https://<project-ref>.supabase.co/functions/v1/analyse-plante
//        VITE_SUPABASE_ANON_KEY=<your anon key>
//
// Request:  POST { imageDataUrl: "data:image/...;base64,...", plantContext?: {...} }
// Response: { ok: true, result: <PremiumDiagnostic> } | { ok: false, error, message }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// ── Premium diagnostic JSON contract (kept in sync with src/utils/plantVision.js) ──
const SYSTEM_PROMPT = `Tu es un expert en potager familial, culture en pots, bacs et petits espaces.
Tu analyses des photos de plantes potagères et tu produis un RAPPORT PREMIUM structuré.
Tu dois répondre uniquement en JSON valide, sans texte autour, sans markdown.
Sois prudent : si tu n'es pas sûr d'un point, baisse le niveau de confiance plutôt que d'inventer.
Le score de santé "health_score" va de 0 (très mauvais état) à 100 (excellent état).
"water_need" doit valoir exactement "faible", "moyen" ou "élevé".
"exposure" doit valoir exactement "soleil", "mi-ombre" ou "ombre".
"urgency" doit valoir exactement "faible", "moyen" ou "élevé" et reflète le besoin d'action rapide.
"diseases" liste les maladies/parasites/carences détectés ou suspectés (peut être vide si tout va bien),
chaque entrée a un nom court (ex. "pucerons", "oïdium", "mildiou", "carence en azote", "stress hydrique")
et une "severity" parmi "faible", "moyen", "élevé".
"immediate_actions" liste 3 à 5 actions concrètes et réalisables immédiatement, formulées à l'impératif et courtes
(ex. "Retirer les feuilles malades", "Arroser profondément", "Ajouter du compost", "Surveiller dans 7 jours").
Réponds uniquement avec ce JSON :
{
  "plant_detected": "",
  "scientific_name": "",
  "confidence": 0,
  "health_status": "excellent|bon|moyen|mauvais",
  "health_score": 0,
  "growth_stage": "",
  "water_need": "faible|moyen|élevé",
  "exposure": "soleil|mi-ombre|ombre",
  "urgency": "faible|moyen|élevé",
  "diseases": [{ "name": "", "severity": "faible|moyen|élevé" }],
  "observations": [],
  "possible_issues": [],
  "immediate_actions": [],
  "recommended_actions": [{ "title": "", "priority": "haute|moyenne|faible", "description": "" }],
  "watering_advice": "",
  "fertilizer_advice": "",
  "harvest_estimate": "",
  "next_check": ""
}`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function buildUserText(plantContext?: Record<string, string>) {
  return plantContext?.name
    ? `Voici une photo d'une plante de mon potager. Plante suivie dans mon application : ${plantContext.name}` +
      `${plantContext.variety ? ` (${plantContext.variety})` : ""}` +
      `${plantContext.stage ? `, stade actuellement suivi : ${plantContext.stage}` : ""}` +
      `${plantContext.location ? `, emplacement : ${plantContext.location}` : ""}.` +
      ` Confirme ou corrige ces informations à partir de la photo, puis fournis ton rapport premium complet.`
    : "Voici une photo d'une plante de mon potager (jardin familial, culture en pots/bacs/pleine terre). " +
      "Identifie la plante puis fournis ton rapport premium complet.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return json({ ok: false, error: "missing_key", message: "OPENAI_API_KEY non configurée côté serveur (supabase secrets set OPENAI_API_KEY=...)." }, 500);
  }

  let body: { imageDataUrl?: string; plantContext?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad_request", message: "Corps JSON invalide." }, 400);
  }

  const { imageDataUrl, plantContext } = body;
  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
    return json({ ok: false, error: "bad_request", message: "imageDataUrl manquante ou invalide (attendu : data:image/...;base64,...)." }, 400);
  }

  const model = Deno.env.get("OPENAI_VISION_MODEL") || "gpt-4o-mini";

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: buildUserText(plantContext) },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    return json({ ok: false, error: "network", message: `Impossible de joindre OpenAI : ${err}` }, 502);
  }

  if (!response.ok) {
    let message = `Erreur API OpenAI (${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody?.error?.message) message = errBody.error.message;
    } catch { /* ignore parse error */ }
    return json({ ok: false, error: "api_error", message }, 502);
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = await response.json();
  } catch {
    return json({ ok: false, error: "invalid_response", message: "Réponse OpenAI illisible." }, 502);
  }

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) return json({ ok: false, error: "empty_response", message: "Réponse vide de l'IA." }, 502);

  try {
    const parsed = JSON.parse(raw);
    return json({ ok: true, result: parsed });
  } catch {
    return json({ ok: false, error: "invalid_json", message: "L'IA n'a pas renvoyé un JSON valide.", raw }, 502);
  }
});
