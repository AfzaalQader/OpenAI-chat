// Base URL of the Django backend. Override via frontend/.env (VITE_API_URL).
const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

export async function sendMessage(message, conversationId) {
  const response = await fetch(`${API_BASE}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation_id: conversationId ?? null,
    }),
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      detail = data.detail ?? detail;
    } catch {
      // response had no JSON body; keep the generic message
    }
    throw new Error(detail);
  }

  return response.json();
}
