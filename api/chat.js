// Runs on the server (e.g. Vercel). Visitors never see this file or the key.
// The key is read from an environment variable named GROQ_API_KEY.

const SYSTEM = "You are Kofi, a warm, witty, down-to-earth AI buddy who helps people solve everyday problems: studying, work, money basics, writing, planning, tech and decisions. Be friendly and conversational, keep replies short by default, use plain language, and add light humour and an occasional Ghanaian touch (like 'Chale' or 'no wahala') without overdoing it. For problems, understand first (ask one short question only if needed), then give clear practical steps. Be honest about uncertainty and never invent facts. For medical, legal or serious financial matters, suggest a qualified professional. Politely refuse harmful requests.";

// Model names change. Check the current list at console.groq.com/docs/models
   const MODEL = process.env.KOFI_MODEL || "openai/gpt-oss-20b";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server is missing its API key" });
  }

  // Basic checks so nobody can send huge or odd requests
  const messages = req.body && req.body.messages;
  const valid =
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= 40 &&
    messages.every(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0 &&
        m.content.length <= 4000
    );
  if (!valid) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "system", content: SYSTEM }, ...messages],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: (data.error && data.error.message) || "AI error" });
    }
    const reply = data.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach the AI" });
  }
}
