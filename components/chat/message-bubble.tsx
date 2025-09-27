"use client"

import type { ChatMessage } from "./helpers"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function MessageBubble({
  msg,
  isOwn,
  isLastOwnAndSeen,
}: {
  msg: ChatMessage
  isOwn: boolean
  isLastOwnAndSeen: boolean
}) {
  const bubble = (
    <div
      className={cn(
        "rounded-lg px-3 py-2 max-w-[80%] break-words",
        isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        msg._status === "pending" && "opacity-70",
        msg._status === "failed" && "border border-destructive text-destructive-foreground",
      )}
      aria-live="polite"
    >
      {msg.media_url ? (
        renderMedia(msg.media_url, msg.media_type)
      ) : msg.content ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
      ) : null}
      {isOwn && msg._status === "pending" && <p className="mt-1 text-[10px] opacity-80">Sending…</p>}
      {isOwn && msg._status === "failed" && <p className="mt-1 text-[10px] opacity-90">Failed. Tap to retry.</p>}
    </div>
  )

  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div className="flex flex-col items-end gap-1">
        {bubble}
        {isOwn && isLastOwnAndSeen && <span className="text-xs text-muted-foreground">Seen</span>}
      </div>
    </div>
  )
}

function renderMedia(url: string, type: ChatMessage["media_type"]) {
  if (type === "image" || (!type && isLikelyImage(url))) {
    return (
      <Image
        src={url || "/placeholder.svg"}
        alt="uploaded image"
        width={320}
        height={320}
        className="rounded-md h-auto w-auto max-w-full"
      />
    )
  }
  if (type === "video") {
    return (
      <video controls className="rounded-md max-w-full">
        <source src={url} />
      </video>
    )
  }
  if (type === "audio") {
    return <audio controls src={url} className="w-full" />
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="underline">
      Download file
    </a>
  )
}

function isLikelyImage(u: string) {
  return /\.(png|jpg|jpeg|gif|webp|avif)$/i.test(u)
}
