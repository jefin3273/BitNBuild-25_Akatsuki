"use client"

import { useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Copy, Download, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  content: string
  loading?: boolean
  error?: string | null
}

export function SowViewer({ content, loading, error }: Props) {
  const canShow = !!content && !loading && !error

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content || "")
    } catch {
      // no-op: clipboard might be unavailable
    }
  }, [content])

  const handleDownloadDocx = useCallback(async () => {
    try {
      const { Document, Packer, Paragraph } = await import("docx")
      const lines = (content || "").split("\n")
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: lines.map((line) => new Paragraph(line)),
          },
        ],
      })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "sow.docx"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // gracefully degrade to plain text with .docx extension (not ideal, but provides a file)
      const blob = new Blob([content || ""], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "sow.docx"
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [content])

  const handleDownloadPdf = useCallback(async () => {
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({ unit: "pt", format: "a4" })
      const margin = 40
      const maxWidth = 515 // roughly page width minus margins (595 - 2*40)
      const text = content || ""
      const lines = doc.splitTextToSize(text, maxWidth)
      let y = margin
      lines.forEach((line: string) => {
        if (y > 780) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += 16
      })
      doc.save("sow.pdf")
    } catch {
      // fallback: download as .txt
      const blob = new Blob([content || ""], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "sow.txt"
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [content])

  return (
    <section aria-labelledby="generated-sow">
      <Card className={cn("border-border")}>
        <CardHeader className="flex items-center justify-between gap-2 md:flex-row md:items-center">
          <CardTitle id="generated-sow" className="text-lg">
            Generated SOW
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!content || !!error || !!loading}>
              <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDocx}
              disabled={!content || !!error || !!loading}
            >
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              .docx
            </Button>
            <Button variant="default" size="sm" onClick={handleDownloadPdf} disabled={!content || !!error || !!loading}>
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Generating your SOW…</div>}
          {error && <div className="text-sm text-destructive">Error: {error}</div>}
          {canShow ? (
            <ScrollArea className="h-[420px] rounded-md border border-border p-4">
              <article className="prose prose-sm max-w-none dark:prose-invert">
                {/* Render markdown as plain text; can be enhanced with a markdown renderer if desired */}
                <pre className="whitespace-pre-wrap break-words font-sans text-foreground">{content}</pre>
              </article>
            </ScrollArea>
          ) : null}
          {!loading && !error && !content && (
            <p className="text-sm text-muted-foreground">The generated SOW will appear here.</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
