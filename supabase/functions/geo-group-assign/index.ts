import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { user_id, lat, lng } = await req.json();
    if (!user_id || lat == null || lng == null) {
      return new Response(JSON.stringify({ error: "Missing user_id, lat, lng" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
