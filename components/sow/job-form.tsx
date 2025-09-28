"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading?: boolean
}

export function JobForm({ value, onChange, onSubmit, loading }: Props) {
  return (
    <section aria-labelledby="job-form" className="mb-8">
      <h2 id="job-form" className="sr-only">
        Job Description Form
      </h2>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="job-description">Job Description</Label>
          <Textarea
            id="job-description"
            placeholder="Paste the job description or write the project details here..."
            className="min-h-[180px]"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={onSubmit}
            disabled={loading || value.trim().length < 10}
            aria-disabled={loading || value.trim().length < 10}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Generating...
              </span>
            ) : (
              "Generate SOW"
            )}
          </Button>
          <p className="text-sm text-muted-foreground">Provide enough detail for accurate results.</p>
        </div>
      </div>
    </section>
  )
}
