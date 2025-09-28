"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getOtherUsers, supabase } from "@/lib/supabaseClient";
import { PAGE_SIZE, type ChatMessage, participantsKey } from "./helpers";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";
import { TypingIndicator } from "./typing-indicator";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { MessageCircle, X } from "lucide-react";
import ChatComponent from "./ChatComponent";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  projectId: string;
  onMessageSent?: (message: ChatMessage) => void;
  className?: string;
  folder?: string; // cloudinary folder
  uploadPreset?: string; // optional
};

export default function ChatHeader({
  projectId,
  onMessageSent,
  className,
  folder,
  uploadPreset,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pendingQueue, setPendingQueue] = useState<ChatMessage[]>([]);
  const [openChat, setOpenChat] = useState(false);

  const { user } = useAuth();
  const { otherUsers } = getOtherUsers(user.id);

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
        <ChatComponent userId={userId} projectId="1" receiverId={receiverId} />
      ) : (
        ""
      )}
    </div>
  );
}
