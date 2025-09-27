export type ChatMessage = {
  id: string
  project_id: string
  sender_id: string
  receiver_id: string
  content: string | null
  media_url: string | null
  media_type: "image" | "video" | "audio" | "file" | null
  created_at: string
  // client-only fields
  _status?: "pending" | "failed" | "sent"
  _tempId?: string
}

export type SendPayload = {
  content?: string
  files?: File[]
}

export function participantsKey(projectId: string, a: string, b: string) {
  const [x, y] = [a, b].sort()
  return `${projectId}:${x}:${y}`
}

export function groupByDay(messages: ChatMessage[]) {
  const out: Record<string, ChatMessage[]> = {}
  for (const m of messages) {
    const day = new Date(m.created_at).toDateString()
    ;(out[day] ||= []).push(m)
  }
  return out
}

export const PAGE_SIZE = 30
