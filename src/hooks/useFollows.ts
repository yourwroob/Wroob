import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useFollows(targetUserId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isFollowing = false } = useQuery({
    queryKey: ["following", user?.id, targetUserId],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["followerCount", targetUserId],
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);
      return count ?? 0;
    },
    enabled: !!targetUserId,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ["followingCount", targetUserId],
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId);
      return count ?? 0;
    },
    enabled: !!targetUserId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["following", user?.id, targetUserId] });
    queryClient.invalidateQueries({ queryKey: ["followerCount", targetUserId] });
    queryClient.invalidateQueries({ queryKey: ["followingCount", targetUserId] });
    queryClient.invalidateQueries({ queryKey: ["followersList", targetUserId] });
    queryClient.invalidateQueries({ queryKey: ["followingList", targetUserId] });
  };

  const follow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
      } as any);
      if (error) throw error;

      // Get follower's name for the notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const followerName = profile?.full_name || "Someone";

      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "general" as const,
        title: "New Follower",
        message: `${followerName} started following you.`,
        link: "/students",
      });
    },
    onSuccess: invalidate,
  });

  const unfollow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { isFollowing, followerCount, followingCount, follow, unfollow };
}

export function useFollowList(userId: string, type: "followers" | "following") {
  return useQuery({
    queryKey: [type === "followers" ? "followersList" : "followingList", userId],
    queryFn: async () => {
      if (type === "followers") {
        const { data } = await supabase
          .from("follows")
          .select("follower_id, created_at")
          .eq("following_id", userId);
        if (!data || data.length === 0) return [];
        const ids = data.map((d) => d.follower_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", ids);
        return profiles ?? [];
      } else {
        const { data } = await supabase
          .from("follows")
          .select("following_id, created_at")
          .eq("follower_id", userId);
        if (!data || data.length === 0) return [];
        const ids = data.map((d) => d.following_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", ids);
        return profiles ?? [];
      }
    },
    enabled: !!userId,
  });
}
