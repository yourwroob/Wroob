import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const applySchema = z.object({
  internship_id: z.string().uuid("internship_id must be a valid UUID"),
  cover_letter: z.string().max(5000).optional().nullable(),
});

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "https://wroob.in";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const responseHeaders = {
  ...corsHeaders,
  ...securityHeaders,
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...responseHeaders },
      });
    }

    // FIX (HIGH-9): Use getUser() — the documented, stable server-side method.
    // getClaims() is a non-standard internal API that may break on SDK updates.
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...responseHeaders },
      });
    }

    // Service role client for privileged DB operations (rate limit, atomic RPC)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // FIX (HIGH-employer-apply): Enforce student-only access at the function layer.
    // apply_to_internship_atomic is SECURITY DEFINER and bypasses RLS — without this
    // check, an employer can call the function and insert a fake application row.
    // Use service-role client so the role lookup cannot be spoofed by the caller.
    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    // FIX (HIGH-role-error-mask): Separate transient DB errors from authorization
    // failures. Previously roleError collapsed into the same 403 branch as a
    // missing/wrong role, so a valid student got "Only students can apply" on
    // any user_roles table failure instead of a retryable 500.
    if (roleError) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...responseHeaders },
      });
    }
    if (!roleRow || roleRow.role !== "student") {
      return new Response(
        JSON.stringify({ error: "Only students can apply to internships.", code: "FORBIDDEN" }),
        { status: 403, headers: { ...responseHeaders } }
      );
    }

    // FIX (CRITICAL-5): Parse and validate the request body BEFORE the rate-limit
    // check so that malformed/invalid requests don't consume rate-limit credits.
    // Previously the rate limit was checked at line ~68 and the body was only
    // parsed at ~92, meaning every bad request burned a slot.
    const rawBody = await req.json();
    const parsed = applySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.issues.map(i => i.message).join("; ") }),
        { status: 400, headers: { ...responseHeaders } }
      );
    }
    const { internship_id, cover_letter } = parsed.data;

    // FIX (HIGH-deadline): Validate deadline before consuming rate-limit quota.
    // apply_to_internship_atomic checks status === 'closed' and capacity but never
    // checks the deadline field, so applications were accepted past the cutoff date.
    const { data: internshipMeta, error: metaError } = await supabaseAdmin
      .from("internships")
      .select("status, deadline")
      .eq("id", internship_id)
      .maybeSingle();

    if (metaError || !internshipMeta) {
      return new Response(JSON.stringify({ error: "Internship not found", code: "NOT_FOUND" }), {
        status: 404,
        headers: { ...responseHeaders },
      });
    }

    if (internshipMeta.deadline && new Date(internshipMeta.deadline) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Application deadline has passed", code: "DEADLINE_PASSED" }),
        { status: 409, headers: { ...responseHeaders } }
      );
    }

    // FIX (HIGH-4): Atomic rate limit check — single DB call with FOR UPDATE locking.
    // Only reached after the body is validated, so bad requests don't consume quota.
    const { data: allowed, error: rlError } = await supabaseAdmin.rpc(
      "check_and_increment_rate_limit",
      {
        p_user_id: user.id,
        p_function_name: "apply_to_internship",
        p_max_requests: 10,
        p_window_ms: 60 * 60 * 1000,
      }
    );

    if (rlError) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...responseHeaders },
      });
    }

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later.", code: "RATE_LIMITED" }),
        { status: 429, headers: { ...responseHeaders } }
      );
    }

    // FIX (CRITICAL-4): All cap logic is now a single atomic transaction in the DB.
    // SELECT FOR UPDATE serializes concurrent requests; the cap cannot be exceeded.
    const { data: rows, error: rpcError } = await supabaseAdmin.rpc(
      "apply_to_internship_atomic",
      {
        p_student_id: user.id,
        p_internship_id: internship_id,
        p_cover_letter: cover_letter ?? null,
      }
    );

    if (rpcError) {
      return new Response(
        JSON.stringify({ error: rpcError.message || "Internal server error" }),
        { status: 500, headers: { ...responseHeaders } }
      );
    }

    const result = rows?.[0];
    if (!result) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...responseHeaders },
      });
    }

    if (!result.success) {
      const statusCode =
        result.error_code === "NOT_FOUND" ? 404
        : result.error_code === "DUPLICATE" ? 409
        : result.error_code === "CAPACITY_REACHED" ? 409
        : result.error_code === "CLOSED" ? 409
        : 400;

      return new Response(
        JSON.stringify({ error: result.error_message, code: result.error_code }),
        { status: statusCode, headers: { ...responseHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Application submitted! (${result.application_count}/${result.app_cap} slots filled)`,
        application_count: result.application_count,
        app_cap: result.app_cap,
      }),
      { status: 200, headers: { ...responseHeaders } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...responseHeaders },
    });
  }
});
