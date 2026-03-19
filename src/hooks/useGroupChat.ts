import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
}

export function useGroupChat(groupId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);

    // Fetch existing messages
    supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as GroupMessage[]);
        setLoading(false);
      });

    // Subscribe to realtime
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as GroupMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!groupId || !user) return;

      // Get sender name from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      await supabase.from("group_messages").insert({
        group_id: groupId,
        sender_id: user.id,
        sender_name: profile?.full_name || "Anonymous",
        text,
      });
    },
    [groupId, user]
  );

  return { messages, sendMessage, loading };
}
