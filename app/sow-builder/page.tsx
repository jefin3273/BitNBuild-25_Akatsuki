"use client"

import { useState } from "react"
import { Hero } from "@/components/sow/hero"
import { JobForm } from "@/components/sow/job-form"
import { SowViewer } from "@/components/sow/sow-viewer"
import { Separator } from "@/components/ui/separator"

export default function SowBuilderPage() {
  const [jobDescription, setJobDescription] = useState("")
  const [sowText, setSowText] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(desc: string) {
    setError(null)
    setSowText("")
    setLoading(true)
    try {
      const res = await fetch("/api/generate-sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: desc }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to generate SOW")
      }
      const data = (await res.json()) as { text: string }
      setSowText(data.text || "")
    } catch (e: any) {
      setError(e?.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl pt-20 px-8 py-10 md:py-14">
        <Hero />
        <Separator className="my-6" />
        <JobForm
          value={jobDescription}
          onChange={setJobDescription}
          onSubmit={() => handleGenerate(jobDescription)}
          loading={loading}
        />
        <SowViewer content={sowText} loading={loading} error={error} />
      </div>
    </main>
  )
}
