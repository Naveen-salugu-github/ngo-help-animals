"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function BrandCsrClient({
  brandName,
  totals,
}: {
  brandName: string
  totals: string
}) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/v1/ai/csr-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ brandName, totals }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      setSummary(data.summary)
      toast.success("CSR narrative ready")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "AI unavailable")
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!summary) return
    const blob = new Blob([summary], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `csr-summary-${brandName.replace(/\s+/g, "-")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSR impact report</CardTitle>
        <CardDescription>
          Auto-generate a narrative paragraph for annual reports using Groq (configure{" "}
          <code className="text-xs">GROQ_API_KEY</code>).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={generate}>
            {loading ? "Generating…" : "Generate CSR summary"}
          </Button>
          {summary && (
            <Button type="button" size="sm" variant="secondary" onClick={download}>
              Download .txt
            </Button>
          )}
        </div>
        {summary && (
          <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-4 text-sm">{summary}</pre>
        )}
      </CardContent>
    </Card>
  )
}
