import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limit: 30 requests per hour per user
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_FN_NAME = "geo_group_assign";

async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const { data } = await supabaseAdmin
    .from("rate_limits")
    .select("timestamps")
    .eq("user_id", userId)
    .eq("function_name", RATE_LIMIT_FN_NAME)
    .maybeSingle();
  const existing: number[] = data?.timestamps ?? [];
  const recent = existing.filter((ts: number) => ts > windowStart);
  if (recent.length >= RATE_LIMIT_MAX) {
    const oldest = Math.min(...recent);
    const retryAfterSeconds = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  const updated = [...recent, now].slice(-200);
  await supabaseAdmin
    .from("rate_limits")
    .upsert(
      { user_id: userId, function_name: RATE_LIMIT_FN_NAME, timestamps: updated, updated_at: new Date().toISOString() },
      { onConflict: "user_id,function_name" }
    );
  return { allowed: true };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple geohash encoder (precision 5 ≈ ~5km cells)
function encodeGeohash(lat: number, lng: number, precision = 5): string {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let idx = 0, bit = 0, evenBit = true;
  let hash = "";
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;

  while (hash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) { idx = idx * 2 + 1; lngMin = mid; }
      else { idx = idx * 2; lngMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { idx = idx * 2 + 1; latMin = mid; }
      else { idx = idx * 2; latMax = mid; }
    }
    evenBit = !evenBit;
    if (++bit === 5) { hash += BASE32[idx]; bit = 0; idx = 0; }
  }
  return hash;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- JWT auth check ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_id = claimsData.claims.sub;
    // --- End auth check ---

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Rate Limit Check ──────────────────────────────────────────────────
    const rateLimitResult = await checkRateLimit(supabase, user_id as string);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", retryAfter: 3600 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng } = await req.json();
    if (lat == null || lng == null) {
      return new Response(JSON.stringify({ error: "Missing lat, lng" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geohash = encodeGeohash(lat, lng, 5);

    // Update student profile with geo data
    await supabase
      .from("student_profiles")
      .update({ lat, lng, geohash })
      .eq("user_id", user_id);

    // Find existing geo groups with matching geohash prefix (first 4 chars for broader match)
    const prefix = geohash.substring(0, 4);
    const { data: existingGroups } = await supabase
      .from("groups")
      .select("*")
      .eq("type", "geo")
      .gte("geohash", prefix)
      .lte("geohash", prefix + "~");

    let matchedGroupId: string | null = null;

    if (existingGroups) {
      for (const group of existingGroups) {
        if (group.centroid_lat != null && group.centroid_lng != null) {
          const dist = haversineKm(lat, lng, group.centroid_lat, group.centroid_lng);
          if (dist <= 5) {
            matchedGroupId = group.id;
            break;
          }
        }
      }
    }

    if (matchedGroupId) {
      // Add user to existing group
      await supabase
        .from("group_members")
        .upsert({ group_id: matchedGroupId, user_id }, { onConflict: "group_id,user_id" });
    } else {
      // Create new geo group
      const { data: newGroup } = await supabase
        .from("groups")
        .insert({
          type: "geo",
          geohash,
          label: `Local Community — ${geohash.substring(0, 4)}`,
          centroid_lat: lat,
          centroid_lng: lng,
        })
        .select("id")
        .single();

      if (newGroup) {
        await supabase
          .from("group_members")
          .insert({ group_id: newGroup.id, user_id });
        matchedGroupId = newGroup.id;
      }
    }

    return new Response(
      JSON.stringify({ success: true, group_id: matchedGroupId, geohash }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
