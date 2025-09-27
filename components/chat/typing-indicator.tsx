"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient";

export function TypingIndicator({
  projectId,
  userId,
  receiverId,
}: {
  projectId: string
  userId: string
  receiverId: string
}) {
  const [show, setShow] = useState(false)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    const [a, b] = [userId, receiverId].sort()
    const key = `${projectId}:${a}:${b}`
    const channel = supabase.channel(`typing:${key}`, { config: { broadcast: { ack: true } } })

    channel.on("broadcast", { event: "typing" }, (payload) => {
      const from = (payload.payload as any)?.from
      const isTyping = (payload.payload as any)?.isTyping
      if (from && from !== userId) {
        setShow(Boolean(isTyping))
        clearTimeout(timerRef.current)
        if (isTyping) {
          timerRef.current = setTimeout(() => setShow(false), 3000)
        }
      }
    })

    channel.subscribe()

    return () => {
      clearTimeout(timerRef.current)
      channel.unsubscribe()
    }
  }, [projectId, userId, receiverId, supabase])

  if (!show) return null
  return <div className="text-xs text-muted-foreground px-1 py-1">Typing…</div>
}
