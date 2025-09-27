"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"
import { supabase } from "@/lib/supabaseClient";
import { participantsKey } from "./helpers"

export function MessageComposer({
  projectId,
  userId,
  receiverId,
  onSend,
}: {
  projectId: string
  userId: string
  receiverId: string
  onSend: (content: string, files: File[]) => void
}) {
  const [value, setValue] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const key = participantsKey(projectId, userId, receiverId)
  const [isTyping, setIsTyping] = useState(false)
  const lastTypedRef = useRef<number>(0)

  // Setup typing broadcast
  useEffect(() => {
    const channel = supabase.channel(`typing:${key}`, {
      config: { broadcast: { ack: true } },
    })
    typingChannelRef.current = channel
    channel.subscribe()

    const interval = setInterval(() => {
      if (isTyping && Date.now() - lastTypedRef.current > 2000) {
        setIsTyping(false)
        channel.send({ type: "broadcast", event: "typing", payload: { from: userId, isTyping: false } })
      }
    }, 800)

    return () => {
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [key, supabase, userId, isTyping])

  function handleTyping(next: string) {
    setValue(next)
    if (!isTyping) {
      setIsTyping(true)
      typingChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: userId, isTyping: true } })
    }
    lastTypedRef.current = Date.now()
  }

  function pickFiles() {
    fileInputRef.current?.click()
  }

  function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  function send() {
    if (!value.trim() && files.length === 0) return
    onSend(value, files)
    setValue("")
    setFiles([])
    typingChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: userId, isTyping: false } })
    setIsTyping(false)
  }

  return (
    <div className="flex items-end gap-2 border-t pt-2">
      <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={onFilesChosen} />
      <Button variant="ghost" onClick={pickFiles} aria-label="Attach files">
        <Paperclip className="size-5" />
      </Button>
      <div className="flex-1">
        <Textarea
          value={value}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message"
          className="min-h-[44px] max-h-40"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {files.map((f, i) => (
              <span key={i} className="rounded bg-muted px-2 py-1">
                {f.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <Button onClick={send} aria-label="Send message">
        <Send className="mr-2 size-4" />
        Send
      </Button>
    </div>
  )
}
