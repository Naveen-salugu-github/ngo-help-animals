import Groq from "groq-sdk"

function getClient() {
  const key = process.env.GROQ_API_KEY
  if (!key) return null
  return new Groq({ apiKey: key })
}

export async function generateImpactCaption(context: string): Promise<string | null> {
  const client = getClient()
  if (!client) return null
  const chat = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You write short, trustworthy impact captions for a social good platform. One or two sentences, warm and factual. No hashtags.",
      },
      { role: "user", content: context },
    ],
    max_tokens: 120,
  })
  return chat.choices[0]?.message?.content?.trim() ?? null
}

export async function summarizeProjectReport(report: string): Promise<string | null> {
  const client = getClient()
  if (!client) return null
  const chat = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "Summarize NGO project reports in 3 bullet points for donors. Plain text bullets.",
      },
      { role: "user", content: report.slice(0, 12000) },
    ],
    max_tokens: 300,
  })
  return chat.choices[0]?.message?.content?.trim() ?? null
}

export async function moderateText(text: string): Promise<{
  allowed: boolean
  reason?: string
} | null> {
  const client = getClient()
  if (!client) return null
  const chat = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          'You are a content moderator. Reply with JSON only: {"allowed":true|false,"reason":"short reason if not allowed"}. Flag hate, harassment, scams, explicit content.',
      },
      { role: "user", content: text.slice(0, 4000) },
    ],
    max_tokens: 100,
    response_format: { type: "json_object" },
  })
  const raw = chat.choices[0]?.message?.content
  if (!raw) return { allowed: true }
  try {
    const parsed = JSON.parse(raw) as { allowed?: boolean; reason?: string }
    return { allowed: parsed.allowed !== false, reason: parsed.reason }
  } catch {
    return { allowed: true }
  }
}

export async function generateCsrSummary(input: {
  brandName: string
  totals: string
}): Promise<string | null> {
  const client = getClient()
  if (!client) return null
  const chat = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "Write a concise CSR impact paragraph suitable for an annual report. Professional tone, 4–6 sentences.",
      },
      {
        role: "user",
        content: `Brand: ${input.brandName}\nMetrics:\n${input.totals}`,
      },
    ],
    max_tokens: 350,
  })
  return chat.choices[0]?.message?.content?.trim() ?? null
}
