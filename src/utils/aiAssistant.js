export async function askRemoteAssistant({ question, context }) {
  const endpoint = import.meta.env.VITE_ASSISTANT_ENDPOINT || "";
  if (!endpoint) {
    return { ok: false, answer: "", message: "Aucun endpoint IA configuré." };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, context })
  });

  if (!response.ok) {
    return { ok: false, answer: "", message: "Assistant IA indisponible." };
  }

  const data = await response.json();
  return { ok: true, answer: data.answer || data.message || "" };
}
