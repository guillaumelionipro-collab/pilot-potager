// Real AI photo-diagnosis using OpenAI's Vision API (gpt-4o-mini by default).
//
// Configuration: add VITE_OPENAI_API_KEY=sk-... to a local .env file (gitignored).
// Without a key, the app keeps working in demo mode (see PhotoAnalysis.jsx).
//
// ⚠️ Security note: this calls OpenAI directly from the browser, so the API key
// is visible in network requests made by your own machine. That's acceptable for
// a personal/local app. For a deployed multi-user app, proxy this call through a
// small backend (or a Supabase Edge Function) so the key never reaches the client.

export const SYSTEM_PROMPT = `Tu es un expert en potager familial, culture en pots, bacs et petits espaces.
Tu analyses les photos de plantes potagères.
Tu dois répondre uniquement en JSON valide.
Tu dois être prudent : si tu n'es pas sûr, indique un niveau de confiance plus faible.
Tu dois détecter : type de plante, état de santé, stade de croissance, signes de maladie,
signes de carence, stress hydrique, insectes possibles, floraison, fructification,
besoin de taille, tuteurage, arrosage, engrais, estimation de récolte.
Donne des conseils simples, concrets, applicables. Évite les diagnostics alarmistes si légers.
Propose toujours une prochaine action claire.
Réponds uniquement avec ce JSON, sans texte autour, sans markdown :
{
  "plant_detected": "",
  "scientific_name": "",
  "confidence": 0,
  "health_status": "",
  "health_score": 0,
  "growth_stage": "",
  "water_need": "faible|moyen|élevé",
  "exposure": "soleil|mi-ombre|ombre",
  "urgency": "faible|moyen|élevé",
  "diseases": [{ "name": "", "severity": "faible|moyen|élevé" }],
  "observations": [],
  "possible_issues": [],
  "recommended_actions": [{ "title": "", "priority": "haute|moyenne|faible", "description": "" }],
  "watering_advice": "",
  "fertilizer_advice": "",
  "harvest_estimate": "",
  "next_check": ""
}`;

const MODEL = import.meta.env.VITE_OPENAI_VISION_MODEL || "gpt-4o-mini";

export function isVisionConfigured() {
  return Boolean(import.meta.env.VITE_PLANT_VISION_ENDPOINT || import.meta.env.VITE_OPENAI_API_KEY);
}

// Lets the UI distinguish "secure proxy" from "direct browser call" so it can
// show an appropriate trust indicator.
export function visionMode() {
  if (import.meta.env.VITE_PLANT_VISION_ENDPOINT) return "proxy";
  if (import.meta.env.VITE_OPENAI_API_KEY) return "direct";
  return "none";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildUserText(plantContext) {
  return plantContext?.name
    ? `Voici une photo d'une plante de mon potager. Plante suivie dans mon application : ${plantContext.name}` +
      `${plantContext.variety ? ` (${plantContext.variety})` : ""}` +
      `${plantContext.stage ? `, stade actuellement suivi : ${plantContext.stage}` : ""}` +
      `${plantContext.location ? `, emplacement : ${plantContext.location}` : ""}.` +
      ` Confirme ou corrige ces informations à partir de la photo, puis fournis ton diagnostic complet.`
    : "Voici une photo d'une plante de mon potager (jardin familial, culture en pots/bacs/pleine terre). " +
      "Identifie la plante puis fournis ton diagnostic complet.";
}

function parseChatCompletionContent(data) {
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) return { ok: false, error: "empty_response", message: "Réponse vide de l'IA." };
  try {
    return { ok: true, result: JSON.parse(raw) };
  } catch {
    return { ok: false, error: "invalid_json", message: "L'IA n'a pas renvoyé un JSON valide.", raw };
  }
}

// ── Mode 1 (recommended for deployed apps): secure server-side proxy ──
// Set VITE_PLANT_VISION_ENDPOINT to a Supabase Edge Function (see
// supabase/functions/analyze-plant/index.ts) or any backend that holds the
// OpenAI key server-side. The client never sees the key.
async function analyzeViaProxy(endpoint, dataUrl, plantContext) {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
      },
      body: JSON.stringify({ imageDataUrl: dataUrl, plantContext }),
    });
  } catch {
    return { ok: false, error: "network", message: "Impossible de joindre le service d'analyse (réseau)." };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "invalid_response", message: "Réponse du service d'analyse illisible." };
  }

  if (!response.ok || data?.ok === false) {
    return { ok: false, error: data?.error || "api_error", message: data?.message || `Erreur du service d'analyse (${response.status})` };
  }
  return data; // already shaped as { ok: true, result }
}

// ── Mode 2 (quick local/personal use): direct call to OpenAI from the browser ──
// Simpler to set up, but the API key travels with the request — see the warning
// at the top of this file. Prefer Mode 1 for anything other than your own machine.
async function analyzeDirect(apiKey, dataUrl, plantContext) {
  let response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 1300,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: buildUserText(plantContext) },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "network", message: "Impossible de joindre l'API OpenAI (réseau)." };
  }

  if (!response.ok) {
    let message = `Erreur API (${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody?.error?.message) message = errBody.error.message;
    } catch { /* ignore parse error */ }
    return { ok: false, error: "api_error", message };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "invalid_response", message: "Réponse de l'API illisible." };
  }

  return parseChatCompletionContent(data);
}

/**
 * Sends a plant photo to the configured AI vision backend and returns a parsed
 * diagnostic object, shaped exactly like the JSON described in SYSTEM_PROMPT.
 *
 * Resolution order:
 *   1. VITE_PLANT_VISION_ENDPOINT (secure proxy, e.g. Supabase Edge Function) — preferred
 *   2. VITE_OPENAI_API_KEY (direct browser call) — quick local/personal setup
 *   3. neither configured → caller should fall back to demo mode
 *
 * @param {File} file - the uploaded image file
 * @param {{name?: string, variety?: string, stage?: string, location?: string}} [plantContext]
 *        optional info about the plant the user picked, to help the model focus its answer
 * @returns {Promise<{ ok: true, result: object } | { ok: false, error: string, message?: string }>}
 */
export async function analyzePlantPhoto(file, plantContext = null) {
  const proxyEndpoint = import.meta.env.VITE_PLANT_VISION_ENDPOINT;
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!proxyEndpoint && !apiKey) {
    return { ok: false, error: "missing_key", message: "Aucun service d'analyse IA configuré (VITE_PLANT_VISION_ENDPOINT ou VITE_OPENAI_API_KEY)." };
  }

  let dataUrl;
  try {
    dataUrl = await fileToDataUrl(file);
  } catch {
    return { ok: false, error: "read_failed", message: "Impossible de lire l'image." };
  }

  if (proxyEndpoint) return analyzeViaProxy(proxyEndpoint, dataUrl, plantContext);
  return analyzeDirect(apiKey, dataUrl, plantContext);
}
