import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PeerUpCircle {
  id: string;
  creator_id: string;
  spot_name: string;
  spot_location: string | null;
  topic: string;
  fuel_type: string;
  drop_in_time: string;
  created_at: string;
  expires_at: string;
  status: string;
  creator_name?: string;
  creator_avatar?: string | null;
  creator_university?: string | null;
  request_count?: number;
  participant_count?: number;
  my_request_status?: string | null;
  is_participant?: boolean;
}

export interface CircleRequest {
  id: string;
  circle_id: string;
  requester_id: string;
  status: string;
  created_at: string;
  requester_name?: string;
  requester_avatar?: string | null;
  requester_info?: string;
}

export interface CircleParticipant {
  id: string;
  circle_id: string;
  user_id: string;
  joined_at: string;
  user_name?: string;
  user_avatar?: string | null;
  user_info?: string;
  is_creator?: boolean;
}

export function usePeerUpCircles() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<PeerUpCircle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCircles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch active circles
      const { data: circlesData, error } = await supabase
        .from("peerup_circles")
        .select("*")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!circlesData) { setCircles([]); return; }

      // Enrich with creator info and counts
      const enriched = await Promise.all(
        circlesData.map(async (c: any) => {
          // Get creator profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", c.creator_id)
            .single();

          const { data: studentProfile } = await supabase
            .from("student_profiles")
            .select("university")
            .eq("user_id", c.creator_id)
            .single();

          // Get request count (for creator)
          let request_count = 0;
          if (c.creator_id === user.id) {
            const { count } = await supabase
              .from("peerup_requests")
              .select("*", { count: "exact", head: true })
              .eq("circle_id", c.id)
              .eq("status", "pending");
            request_count = count || 0;
          }

          // Get participant count
          const { count: pCount } = await supabase
            .from("peerup_participants")
            .select("*", { count: "exact", head: true })
            .eq("circle_id", c.id);

          // Check my request status
          let my_request_status: string | null = null;
          if (c.creator_id !== user.id) {
            const { data: myReq } = await supabase
              .from("peerup_requests")
              .select("status")
              .eq("circle_id", c.id)
              .eq("requester_id", user.id)
              .maybeSingle();
            my_request_status = myReq?.status || null;
          }

          // Check if I'm a participant
          let is_participant = c.creator_id === user.id;
          if (!is_participant) {
            const { data: part } = await supabase
              .from("peerup_participants")
              .select("id")
              .eq("circle_id", c.id)
              .eq("user_id", user.id)
              .maybeSingle();
            is_participant = !!part;
          }

          return {
            ...c,
            creator_name: profile?.full_name || "Student",
            creator_avatar: profile?.avatar_url,
            creator_university: studentProfile?.university,
            request_count,
            participant_count: (pCount || 0) + 1, // +1 for creator
            my_request_status,
            is_participant,
          } as PeerUpCircle;
        })
      );

      setCircles(enriched);
    } catch (err) {
      console.error("Failed to fetch circles:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("peerup-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "peerup_circles" }, () => fetchCircles())
      .on("postgres_changes", { event: "*", schema: "public", table: "peerup_requests" }, () => fetchCircles())
      .on("postgres_changes", { event: "*", schema: "public", table: "peerup_participants" }, () => fetchCircles())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCircles]);

  const createCircle = async (data: {
    spot_name: string;
    spot_location?: string;
    topic: string;
    fuel_type: string;
    drop_in_time: string;
  }) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("peerup_circles").insert({
      creator_id: user.id,
      spot_name: data.spot_name,
      spot_location: data.spot_location || null,
      topic: data.topic,
      fuel_type: data.fuel_type,
      drop_in_time: data.drop_in_time,
    });
    if (error) throw error;
    await fetchCircles();
  };

  const requestToJoin = async (circleId: string) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("peerup_requests").insert({
      circle_id: circleId,
      requester_id: user.id,
    });
    if (error) throw error;
    await fetchCircles();
  };

  const fetchRequests = async (circleId: string): Promise<CircleRequest[]> => {
    const { data, error } = await supabase
      .from("peerup_requests")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const enriched = await Promise.all(
      data.map(async (r: any) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", r.requester_id)
          .single();
        const { data: sp } = await supabase
          .from("student_profiles")
          .select("major, graduation_year")
          .eq("user_id", r.requester_id)
          .single();
        return {
          ...r,
          requester_name: profile?.full_name || "Student",
          requester_avatar: profile?.avatar_url,
          requester_info: sp ? `${sp.major || "Student"} · Year ${sp.graduation_year || ""}` : "Student",
        } as CircleRequest;
      })
    );
    return enriched;
  };

  const handleRequest = async (requestId: string, action: "approved" | "declined", circleId: string, requesterId: string) => {
    const { error } = await supabase
      .from("peerup_requests")
      .update({ status: action })
      .eq("id", requestId);
    if (error) throw error;

    if (action === "approved") {
      await supabase.from("peerup_participants").insert({
        circle_id: circleId,
        user_id: requesterId,
      });
    }
    await fetchCircles();
  };

  const approveAll = async (circleId: string) => {
    const { data: pending } = await supabase
      .from("peerup_requests")
      .select("id, requester_id")
      .eq("circle_id", circleId)
      .eq("status", "pending");

    if (!pending) return;

    for (const req of pending) {
      await handleRequest(req.id, "approved", circleId, req.requester_id);
    }
  };

  const fetchParticipants = async (circleId: string, creatorId: string): Promise<CircleParticipant[]> => {
    const { data, error } = await supabase
      .from("peerup_participants")
      .select("*")
      .eq("circle_id", circleId);

    if (error || !data) return [];

    // Include creator
    const allUserIds = [...new Set([creatorId, ...data.map((p: any) => p.user_id)])];
    
    const participants: CircleParticipant[] = await Promise.all(
      allUserIds.map(async (uid) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", uid)
          .single();
        const { data: sp } = await supabase
          .from("student_profiles")
          .select("major, graduation_year")
          .eq("user_id", uid)
          .single();
        const participant = data.find((p: any) => p.user_id === uid);
        return {
          id: participant?.id || uid,
          circle_id: circleId,
          user_id: uid,
          joined_at: participant?.joined_at || new Date().toISOString(),
          user_name: profile?.full_name || "Student",
          user_avatar: profile?.avatar_url,
          user_info: sp ? `${sp.major || "Student"} · Year ${sp.graduation_year || ""}` : "Student",
          is_creator: uid === creatorId,
        };
      })
    );

    return participants;
  };

  const deleteCircle = async (circleId: string) => {
    const { error } = await supabase
      .from("peerup_circles")
      .delete()
      .eq("id", circleId);
    if (error) throw error;
    await fetchCircles();
  };

  return {
    circles,
    loading,
    createCircle,
    requestToJoin,
    fetchRequests,
    handleRequest,
    approveAll,
    fetchParticipants,
    deleteCircle,
    refresh: fetchCircles,
  };
}
