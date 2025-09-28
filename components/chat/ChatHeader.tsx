"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PAGE_SIZE, type ChatMessage, participantsKey } from "./helpers";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import ChatComponent from "./ChatComponent";

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
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState();
  const [loading, setLoading] = useState(true);

  const { user, profile } = useAuth();

  useEffect(() => {
    const fetchOtherUsers = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .neq("id", profile.id);

        if (error) throw error;
        console.log(data);

        setOtherUsers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchOtherUsers();
  }, [profile?.id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
      {!selectedUser && openChat ? (
        <div
          className={cn(
            "fixed md:bottom-20 bottom-28 z-40 right-4 w-[400px] max-w-[90%] bg-white shadow-2xl rounded-2xl dark:bg-gray-900",
            className
          )}
        >
          <ScrollArea className="min-h-96 flex-col gap-2 px-2">
            {otherUsers.map((val: any, i: any) => (
              <Card
                onClick={() => setSelectedUser(val.id)}
                className="px-4 py-2"
                key={val.id || i}
              >
                <div>
                  <div>{val.name}</div>
                  <div className="text-sm text-gray-400">{val.role}</div>
                </div>
              </Card>
            ))}
          </ScrollArea>
        </div>
      ) : (
        ""
      )}
      {openChat && selectedUser ? (
        <div
          className={cn(
            "fixed md:bottom-20 bottom-28 z-40 right-4 w-[400px] max-w-[90%] bg-white shadow-2xl rounded-2xl dark:bg-gray-900",
            className
          )}
        >
          <ScrollArea className="min-h-96 flex-1 px-3 space-y-1">
            <ChatComponent
              projectId="1"
              userId={!profile?.id as unknown as string}
              receiverId={selectedUser as unknown as string}
            />
          </ScrollArea>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
// <ChatComponent userId={userId} projectId="1" receiverId={receiverId} />
