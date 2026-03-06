import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadGroupMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      // Get user's group IDs
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, joined_at")
        .eq("user_id", user.id);

      if (!memberships?.length) { setCount(0); return; }

      // Get last read timestamp from localStorage
      const lastRead = localStorage.getItem(`groups_last_read_${user.id}`);
      const since = lastRead || new Date(0).toISOString();

      const groupIds = memberships.map((m) => m.group_id);

      const { count: unread } = await supabase
        .from("group_messages")
        .select("*", { count: "exact", head: true })
        .in("group_id", groupIds)
        .neq("sender_id", user.id)
        .gt("created_at", since);

      setCount(unread ?? 0);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markRead = () => {
    if (!user) return;
    localStorage.setItem(`groups_last_read_${user.id}`, new Date().toISOString());
    setCount(0);
  };

  return { count, markRead };
}
