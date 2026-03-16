import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("authorization");

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
  const supabaseUser = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { authorization: authHeader || "" } },
  });

  // Get user
  const {
    data: { user },
  } = await supabaseUser.auth.getUser(authHeader?.replace("Bearer ", ""));

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").filter(Boolean).pop() || "";

  try {
    // POST /campus-status (create status or reply)
    if (req.method === "POST") {
      const body = await req.json();

      if (path === "reply") {
        // Reply to status
        const { status_id, message } = body;
        if (!status_id || !message || message.length > 500) {
          return new Response(
            JSON.stringify({ error: "Invalid reply. Max 500 chars." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabaseAdmin
          .from("status_replies")
          .insert({ status_id, sender_id: user.id, message })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create status
      const { content, latitude, longitude } = body;
      if (!content || content.length > 200 || latitude == null || longitude == null) {
        return new Response(
          JSON.stringify({ error: "Content required (max 200 chars) with location." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("campus_statuses")
        .insert({
          student_id: user.id,
          content,
          latitude,
          longitude,
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /campus-status/nearby or /campus-status/replies?status_id=...
    if (req.method === "GET") {
      if (path === "replies") {
        const statusId = url.searchParams.get("status_id");
        if (!statusId) {
          return new Response(JSON.stringify({ error: "status_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: replies, error } = await supabaseAdmin
          .from("status_replies")
          .select("*")
          .eq("status_id", statusId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Enrich with sender names
        const senderIds = [...new Set(replies?.map((r: any) => r.sender_id) || [])];
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", senderIds);

        const profileMap = new Map(
          (profiles || []).map((p: any) => [p.user_id, p])
        );

        const enriched = (replies || []).map((r: any) => ({
          ...r,
          sender_name: profileMap.get(r.sender_id)?.full_name || "Student",
          sender_avatar: profileMap.get(r.sender_id)?.avatar_url || null,
        }));

        return new Response(JSON.stringify(enriched), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Nearby statuses
      const radiusKm = parseFloat(url.searchParams.get("radius") || "5");
      const lat = parseFloat(url.searchParams.get("latitude") || "0");
      const lng = parseFloat(url.searchParams.get("longitude") || "0");

      if (!lat && !lng) {
        return new Response(
          JSON.stringify({ error: "Location required (latitude, longitude params)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch active statuses
      const { data: statuses, error } = await supabaseAdmin
        .from("campus_statuses")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter by radius
      const nearby = (statuses || [])
        .map((s: any) => ({
          ...s,
          distance_km: haversineDistance(lat, lng, s.latitude, s.longitude),
        }))
        .filter((s: any) => s.distance_km <= radiusKm);

      // Enrich with student names
      const studentIds = [...new Set(nearby.map((s: any) => s.student_id))];
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", studentIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      // Get reply counts
      const statusIds = nearby.map((s: any) => s.id);
      const { data: replyCounts } = await supabaseAdmin
        .from("status_replies")
        .select("status_id")
        .in("status_id", statusIds);

      const replyCountMap = new Map<string, number>();
      (replyCounts || []).forEach((r: any) => {
        replyCountMap.set(r.status_id, (replyCountMap.get(r.status_id) || 0) + 1);
      });

      const enriched = nearby.map((s: any) => ({
        ...s,
        student_name: profileMap.get(s.student_id)?.full_name || "Student",
        student_avatar: profileMap.get(s.student_id)?.avatar_url || null,
        reply_count: replyCountMap.get(s.id) || 0,
      }));

      return new Response(JSON.stringify(enriched), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /campus-status?id=...
    if (req.method === "DELETE") {
      const statusId = url.searchParams.get("id");
      if (!statusId) {
        return new Response(JSON.stringify({ error: "id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseAdmin
        .from("campus_statuses")
        .delete()
        .eq("id", statusId)
        .eq("student_id", user.id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
