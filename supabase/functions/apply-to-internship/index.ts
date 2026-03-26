import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://yourdomain.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit config: max 10 applications per hour per user
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const { data, error } = await supabaseAdmin
    .from("rate_limits")
    .select("timestamps")
    .eq("user_id", userId)
    .eq("function_name", "apply_to_internship")
    .maybeSingle();

  const existing: number[] = data?.timestamps ?? [];
  const recent = existing.filter((ts: number) => ts > windowStart);

  if (recent.length >= RATE_LIMIT_MAX) {
    const oldest = Math.min(...recent);
    const retryAfterSeconds = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Record this request
  const updated = [...recent, now].slice(-200);
  await supabaseAdmin
    .from("rate_limits")
    .upsert(
      {
        user_id: userId,
        function_name: "apply_to_internship",
        timestamps: updated,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,function_name" }
    );

  return { allowed: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // ── Rate Limit Check ──────────────────────────────────────────────────
    const rateLimitResult = await checkRateLimit(supabaseAdmin, userId);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`,
          code: "RATE_LIMITED",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { internship_id, cover_letter } = await req.json();

    if (!internship_id) {
      return new Response(
        JSON.stringify({ error: "internship_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get internship details
    const { data: internship, error: internError } = await supabaseAdmin
      .from("internships")
      .select("id, status, application_count, app_cap, slots")
      .eq("id", internship_id)
      .single();

    if (internError || !internship) {
      return new Response(
        JSON.stringify({ error: "Internship not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Check if internship is still open
    if (internship.status === "closed") {
      return new Response(
        JSON.stringify({ error: "This internship is no longer accepting applications." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: 2X RULE CHECK
    if (internship.application_count >= internship.app_cap) {
      return new Response(
        JSON.stringify({
          error: `Applications are full. This role only accepts ${internship.app_cap} applications (${internship.slots} slots × 2).`,
          code: "CAPACITY_REACHED",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Duplicate check
    const { data: existing } = await supabaseAdmin
      .from("applications")
      .select("id")
      .eq("student_id", userId)
      .eq("internship_id", internship_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "You have already applied to this internship.", code: "DUPLICATE" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 5: Insert application
    const { error: insertError } = await supabaseAdmin.from("applications").insert({
      student_id: userId,
      internship_id,
      cover_letter: cover_letter || null,
    });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 6: Atomically increment application_count
    const newCount = internship.application_count + 1;
    const updates: Record<string, any> = { application_count: newCount };

    // Step 7: Auto-close if cap reached
    if (newCount >= internship.app_cap) {
      updates.status = "closed";
    }

    await supabaseAdmin
      .from("internships")
      .update(updates)
      .eq("id", internship_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Application submitted! (${newCount}/${internship.app_cap} slots filled)`,
        application_count: newCount,
        app_cap: internship.app_cap,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
