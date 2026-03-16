import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CampusStatus {
  id: string;
  student_id: string;
  content: string;
  latitude: number;
  longitude: number;
  created_at: string;
  expires_at: string;
  distance_km: number;
  student_name: string;
  student_avatar: string | null;
  reply_count: number;
}

interface StatusReply {
  id: string;
  status_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

export function useCampusStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<CampusStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError("");
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? "Location access denied. Please enable it in your browser settings."
            : "Could not get your location."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const fetchStatuses = useCallback(async () => {
    if (!location || !user) return;
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/campus-status/nearby?latitude=${location.lat}&longitude=${location.lng}&radius=5`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data)) setStatuses(data);
    } catch {
      toast({ title: "Error", description: "Failed to load nearby statuses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [location, user, toast]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Realtime subscription
  useEffect(() => {
    if (!location) return;
    const channel = supabase
      .channel("campus-statuses-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "campus_statuses" }, () => {
        fetchStatuses();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [location, fetchStatuses]);

  const postStatus = async (content: string) => {
    if (!location || !user) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/campus-status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, latitude: location.lat, longitude: location.lng }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to post status");
    }
    await fetchStatuses();
  };

  const deleteStatus = async (id: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(
      `https://${projectId}.supabase.co/functions/v1/campus-status?id=${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      }
    );
    await fetchStatuses();
  };

  const fetchReplies = async (statusId: string): Promise<StatusReply[]> => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/campus-status/replies?status_id=${statusId}`,
      {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.ok ? await res.json() : [];
  };

  const postReply = async (statusId: string, message: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/campus-status/reply`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status_id: statusId, message }),
      }
    );
    if (!res.ok) throw new Error("Failed to send reply");
  };

  return {
    statuses,
    loading,
    location,
    locationError,
    requestLocation,
    postStatus,
    deleteStatus,
    fetchReplies,
    postReply,
    refresh: fetchStatuses,
  };
}
