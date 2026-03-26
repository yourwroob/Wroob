import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limit: 20 requests per hour per user
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_FN_NAME = "student_reputation";

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
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);

    // ── Rate Limit Check ──────────────────────────────────────────────────
    const rateLimitResult = await checkRateLimit(serviceClient, user.id);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", retryAfter: 3600 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);

    // POST /student-reputation - submit feedback (employer only)
    if (req.method === "POST") {
      const body = await req.json();
      const action = body.action;

      if (action === "submit_feedback") {
        const { student_id, internship_id, rating, review } = body;

        if (!student_id || !internship_id || !rating || rating < 1 || rating > 5) {
          return new Response(JSON.stringify({ error: "Invalid feedback data. Rating must be 1-5." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify employer owns the internship
        const { data: internship } = await serviceClient
          .from("internships")
          .select("employer_id")
          .eq("id", internship_id)
          .single();

        if (!internship || internship.employer_id !== user.id) {
          return new Response(JSON.stringify({ error: "Not authorized to give feedback for this internship" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify student was accepted
        const { data: application } = await serviceClient
          .from("applications")
          .select("id")
          .eq("internship_id", internship_id)
          .eq("student_id", student_id)
          .eq("status", "accepted")
          .single();

        if (!application) {
          return new Response(JSON.stringify({ error: "Can only give feedback for accepted interns" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Insert feedback
        const { error: insertError } = await serviceClient
          .from("internship_feedback")
          .upsert({
            student_id,
            company_id: user.id,
            internship_id,
            rating: Math.min(Math.max(Math.round(rating), 1), 5),
            review: review?.slice(0, 1000) || null,
          }, { onConflict: "student_id,internship_id,company_id" });

        if (insertError) {
          return new Response(JSON.stringify({ error: insertError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Recalculate reputation
        await serviceClient.rpc("update_student_reputation", { _student_id: student_id });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "recalculate") {
        // Allow students to recalculate their own score (e.g. after profile update)
        await serviceClient.rpc("update_student_reputation", { _student_id: user.id });

        const { data: sp } = await serviceClient
          .from("student_profiles")
          .select("reputation_score, completed_internships, skill_test_score, company_feedback_score, profile_strength_score")
          .eq("user_id", user.id)
          .single();

        return new Response(JSON.stringify(sp), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET - fetch reputation for a student
    if (req.method === "GET") {
      const studentId = url.searchParams.get("student_id") || user.id;

      const { data: sp, error } = await serviceClient
        .from("student_profiles")
        .select("reputation_score, completed_internships, skill_test_score, company_feedback_score, profile_strength_score")
        .eq("user_id", studentId)
        .single();

      if (error || !sp) {
        return new Response(JSON.stringify({ error: "Student not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Compute internship_score for breakdown
      const internship_score = Math.min((sp.completed_internships || 0) * 10, 40);

      return new Response(JSON.stringify({
        reputation_score: Number(sp.reputation_score),
        breakdown: {
          internship_score,
          skill_score: Number(sp.skill_test_score),
          feedback_score: Number(sp.company_feedback_score),
          profile_score: Number(sp.profile_strength_score),
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Reputation error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
