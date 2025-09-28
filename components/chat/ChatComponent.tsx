"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabaseClient";
import { PAGE_SIZE, type ChatMessage, participantsKey } from "./helpers";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";
import { TypingIndicator } from "./typing-indicator";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { MessageCircle, X } from "lucide-react";

type Props = {
  projectId: string;
  userId: string;
  receiverId: string;
  onMessageSent?: (message: ChatMessage) => void;
  className?: string;
  folder?: string; // cloudinary folder
  uploadPreset?: string; // optional
};

async function uploadToCloudinary(
  files: File[],
  opts: { folder?: string; uploadPreset?: string }
): Promise<{ url: string; type: ChatMessage["media_type"] }[]> {
  if (!files.length) return [];
  // Get signature from our route
  const sigResp = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      folder: opts.folder,
      upload_preset: opts.uploadPreset,
    }),
  });
  if (!sigResp.ok) throw new Error("Could not get Cloudinary signature");
  const { cloudName, apiKey, timestamp, signature, folder, upload_preset } =
    await sigResp.json();

  const results: { url: string; type: ChatMessage["media_type"] }[] = [];

  for (const file of files) {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp.toString());
    form.append("signature", signature);
    if (folder) form.append("folder", folder);
    if (upload_preset) form.append("upload_preset", upload_preset);

    // Detect type for preview
    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
      ? "audio"
      : "file";

    let attempt = 0;
    const maxAttempts = 3;
    let success = false;
    let resUrl = "";

    while (attempt < maxAttempts && !success) {
      attempt++;
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: form,
        }
      );
      if (res.ok) {
        const json = await res.json();
        resUrl = json.secure_url as string;
        success = true;
      } else if (attempt >= maxAttempts) {
        throw new Error(
          `Cloudinary upload failed after ${maxAttempts} attempts`
        );
      }
    }

    results.push({ url: resUrl, type });
  }

  return results;
}

export default function ChatComponent({
  projectId,
  userId,
  receiverId,
  onMessageSent,
  className,
  folder,
  uploadPreset,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pendingQueue, setPendingQueue] = useState<ChatMessage[]>([]);
  const [openChat, setOpenChat] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const key = useMemo(
    () => participantsKey(projectId, userId, receiverId),
    [projectId, userId, receiverId]
  );

  // SWRInfinite for pagination
  const getKey = (
    pageIndex: number,
    previousPageData: ChatMessage[] | null
  ) => {
    if (previousPageData && previousPageData.length === 0) return null; // reached end
    const before = previousPageData?.at(-1)?.created_at;
    return ["messages", projectId, userId, receiverId, before]
      .filter(Boolean)
      .join(":");
  };

  const fetcher = async (_key: string): Promise<ChatMessage[]> => {
    const [, , , , before] = _key.split(":");
    let query = supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (before) query = query.lt("created_at", before);
    const { data, error } = await query;
    if (error) throw error;
    return (data as any[]).map((d) => ({ ...d, _status: "sent" as const }));
  };

  const {
    data: pages,
    size,
    setSize,
    mutate,
    isValidating,
  } = useSWRInfinite<ChatMessage[]>(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const messages = useMemo(
    () =>
      pages
        ? ([] as ChatMessage[])
            .concat(...pages)
            .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
        : [],
    [pages]
  );

  // Subscribe to realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${projectId}`, {
        config: { presence: { key: userId } },
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: { new: any }) => {
          const m = payload.new as any;
          const match =
            m.project_id === projectId &&
            ((m.sender_id === userId && m.receiver_id === receiverId) ||
              (m.sender_id === receiverId && m.receiver_id === userId));

          if (match) {
            mutate((prev) => {
              const first = prev?.[0] ?? [];
              return [
                [...first, { ...m, _status: "sent" }] as ChatMessage[],
                ...(prev?.slice(1) || []),
              ];
            }, false);
          }
        }
      );

    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [projectId, userId, receiverId, mutate]);

  // Mark reads for messages from the other user
  useEffect(() => {
    const lastFromOther = [...messages]
      .filter((m) => m.sender_id === receiverId)
      .at(-1);
    if (!lastFromOther) return;
    const lastTime = lastFromOther.created_at;
    if (lastSeenAt && +new Date(lastSeenAt) >= +new Date(lastTime)) return;

    const doUpsert = async () => {
      try {
        await supabase.from("message_reads").insert({
          project_id: projectId,
          message_id: lastFromOther.id,
          reader_id: userId,
        });
        setLastSeenAt(lastTime);
      } catch (e) {
        // Silent; reads are best-effort
      }
    };
    void doUpsert();
  }, [messages, receiverId, projectId, userId, lastSeenAt]);

  // Compute "Seen"
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const fetchReads = async () => {
      const lastOwn = [...messages]
        .filter((m) => m.sender_id === userId)
        .at(-1);
      if (!lastOwn) return;

      const { data, error } = await supabase
        .from("message_reads")
        .select("message_id, read_at")
        .eq("project_id", projectId)
        .eq("reader_id", receiverId)
        .order("read_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length) {
        const latestReadMessageId = data[0].message_id as string;
        setSeenIds(new Set([latestReadMessageId]));
      }
    };
    void fetchReads();
  }, [messages, projectId, userId, receiverId]);

  // Compose full list including pending queue
  const fullMessages = useMemo(() => {
    const list = [...messages, ...pendingQueue];
    return list.sort(
      (a, b) => +new Date(a.created_at) - +new Date(b.created_at)
    );
  }, [messages, pendingQueue]);

  async function sendMessage(content: string, files: File[]) {
    setError(null);

    // 1) Optimistic pending messages
    const now = new Date().toISOString();
    const optimistic: ChatMessage[] = [];

    if (content.trim()) {
      optimistic.push({
        id: uuidv4(),
        _tempId: uuidv4(),
        project_id: projectId,
        sender_id: userId,
        receiver_id: receiverId,
        content,
        media_url: null,
        media_type: null,
        created_at: now,
        _status: "pending",
      });
    }

    for (const f of files) {
      optimistic.push({
        id: uuidv4(),
        _tempId: uuidv4(),
        project_id: projectId,
        sender_id: userId,
        receiver_id: receiverId,
        content: null,
        media_url: "/uploading-media-placeholder.jpg",
        media_type: f.type.startsWith("image/")
          ? "image"
          : f.type.startsWith("video/")
          ? "video"
          : f.type.startsWith("audio/")
          ? "audio"
          : "file",
        created_at: now,
        _status: "pending",
      });
    }

    setPendingQueue((prev) => [...prev, ...optimistic]);

    // 2) Upload media with retry; 3) Insert; 4) Clear pending; 5) mutate
    try {
      const uploaded = await uploadToCloudinary(files, {
        folder,
        uploadPreset,
      });
      const toInsert: Partial<ChatMessage>[] = [];

      if (content.trim()) {
        toInsert.push({
          project_id: projectId,
          sender_id: userId,
          receiver_id: receiverId,
          content,
          media_url: null,
          media_type: null,
        });
      }
      for (const u of uploaded) {
        toInsert.push({
          project_id: projectId,
          sender_id: userId,
          receiver_id: receiverId,
          content: null,
          media_url: u.url,
          media_type: u.type,
        });
      }

      if (toInsert.length) {
        const { data, error } = await supabase
          .from("messages")
          .insert(toInsert)
          .select("*");
        if (error) throw error;

        setPendingQueue((prev) => {
          const rest = prev.filter((m) => m._status !== "pending");
          return rest;
        });

        if (onMessageSent && data && data.length) {
          data.forEach((m: any) =>
            onMessageSent({ ...(m as any), _status: "sent" })
          );
        }

        mutate();
      }
    } catch (e: any) {
      setPendingQueue((prev) =>
        prev.map((m) =>
          m._status === "pending" ? { ...m, _status: "failed" } : m
        )
      );
      setError(e?.message || "Failed to send message");
    }
  }

  function retryFailed() {
    const failed = pendingQueue.filter((m) => m._status === "failed");
    const content = failed.find((m) => m.content)?.content || "";
    setError(
      "Some uploads failed. Please reattach files and resend the message."
    );
    setPendingQueue((prev) => prev.filter((m) => m._status !== "failed"));
    if (content) {
      void sendMessage(content, []);
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <button
        onClick={() => setOpenChat(!openChat)}
        className="fixed md:bottom-4 bottom-16 right-4 z-40"
      >
        <div className="bg-gray-900 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-gray-50 rounded-full p-3 shadow-lg cursor-pointer hover:bg-gray-800 transition-colors">
          {openChat ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </div>
      </button>
      {openChat ? (
        <div
          className={cn(
            "fixed md:bottom-20 bottom-28 z-40 right-4 w-[400px] max-w-[90%] bg-white shadow-2xl rounded-2xl dark:bg-gray-900",
            className
          )}
        >
          {error && (
            <Alert variant="destructive" className="rounded-none">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="font-medium text-sm text-pretty">Chat</div>
            {pendingQueue.some((m) => m._status === "failed") && (
              <Button size="sm" variant="outline" onClick={retryFailed}>
                Retry failed
              </Button>
            )}
          </div>

          <ScrollArea className="min-h-96 flex-1 px-3">
            <div
              ref={scrollRef}
              className="mx-auto w-full max-w-2xl py-3 flex flex-col gap-2"
            >
              {fullMessages.map((m) => {
                const isOwn = m.sender_id === userId;
                const isLastOwn =
                  isOwn &&
                  fullMessages.filter((x) => x.sender_id === userId).at(-1)
                    ?.id === m.id;
                const seen = isLastOwn && (seenIds.has(m.id) || false);

                return (
                  <div
                    key={m.id + m._tempId}
                    onClick={() => {
                      if (m._status === "failed") {
                        setPendingQueue((prev) => prev.filter((x) => x !== m));
                      }
                    }}
                  >
                    <MessageBubble
                      msg={m}
                      isOwn={isOwn}
                      isLastOwnAndSeen={Boolean(seen)}
                    />
                  </div>
                );
              })}
              <TypingIndicator
                projectId={projectId}
                userId={userId}
                receiverId={receiverId}
              />
              <div className="flex justify-center py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    isValidating || (pages && pages.at(-1)?.length === 0)
                  }
                  onClick={() => setSize(size + 1)}
                >
                  {isValidating ? "Loading…" : "Load older"}
                </Button>
              </div>
            </div>
          </ScrollArea>

          <div className="px-3 pb-3">
            <MessageComposer
              projectId={projectId}
              userId={userId}
              receiverId={receiverId}
              onSend={(c, f) => void sendMessage(c, f)}
            />
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
