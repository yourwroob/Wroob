import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserGroup {
  id: string;
  type: string;
  label: string;
  created_at: string;
  member_count?: number;
}

export function useUserGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      // Get group IDs the user belongs to
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (!memberships?.length) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupIds = memberships.map((m) => m.group_id);

      // Fetch group details
      const { data: groupsData } = await supabase
        .from("groups")
        .select("*")
        .in("id", groupIds);

      if (groupsData) {
        // Get member counts
        const withCounts = await Promise.all(
          groupsData.map(async (g) => {
            const { count } = await supabase
              .from("group_members")
              .select("*", { count: "exact", head: true })
              .eq("group_id", g.id);
            return { ...g, member_count: count || 0 } as UserGroup;
          })
        );
        setGroups(withCounts);
      }
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { groups, loading };
}
