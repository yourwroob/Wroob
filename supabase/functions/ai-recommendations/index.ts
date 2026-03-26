import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limit: 10 requests per hour per user
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_FN_NAME = "ai_recommendations";

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
  "Access-Control-Allow-Origin": "https://yourdomain.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function skillMatchScore(studentSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills?.length) return 0.5; // neutral if no requirements
  const normStudent = studentSkills.map((s) => s.toLowerCase().trim());
  const normRequired = requiredSkills.map((s) => s.toLowerCase().trim());
  const matched = normRequired.filter((r) => normStudent.some((s) => s.includes(r) || r.includes(s)));
  return matched.length / normRequired.length;
}

function locationMatchScore(studentLocation: string | null, preferredLocations: string[] | null, internshipLocation: string | null, internshipType: string): number {
  if (internshipType === "remote") return 1.0;
  if (!internshipLocation) return 0.5;
  const loc = internshipLocation.toLowerCase();
  if (studentLocation && loc.includes(studentLocation.toLowerCase())) return 1.0;
  if (preferredLocations?.some((p) => loc.includes(p.toLowerCase()))) return 0.8;
  return 0.2;
}

function interestAlignmentScore(studentPrefs: any, studentCulture: any, internship: any): number {
  let score = 0;
  let factors = 0;

  // Role alignment
  if (studentPrefs?.preferred_roles?.length && internship.title) {
    const title = internship.title.toLowerCase();
    const roleMatch = studentPrefs.preferred_roles.some((r: string) => title.includes(r.toLowerCase()));
    score += roleMatch ? 1 : 0;
    factors++;
  }

  // Industry alignment
  if (studentCulture?.tech_interests?.length && internship.industry) {
    const ind = internship.industry.toLowerCase();
    const match = studentCulture.tech_interests.some((t: string) => ind.includes(t.toLowerCase()));
    score += match ? 1 : 0;
    factors++;
  }

  // Career track alignment
  if (studentCulture?.career_track && internship.title) {
    const match = internship.title.toLowerCase().includes(studentCulture.career_track.toLowerCase());
    score += match ? 0.8 : 0;
    factors++;
  }

  return factors > 0 ? score / factors : 0.5;
}

// ── Main handler ────────────────────────────────────────────────────────────

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Auth client to get the user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studentId = user.id;

    // Service client for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Rate Limit Check ──────────────────────────────────────────────────
    const rateLimitResult = await checkRateLimit(supabase, studentId);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", retryAfter: 3600 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for cached recommendations (valid for 24h)
    const { data: cached } = await supabase
      .from("recommendation_cache")
      .select("internship_id, match_score, skill_match_score, interest_alignment_score, location_match_score, explanation")
      .eq("student_id", studentId)
      .gt("expires_at", new Date().toISOString())
      .order("match_score", { ascending: false })
      .limit(10);

    if (cached && cached.length > 0) {
      // Fetch internship details for cached recommendations
      const internshipIds = cached.map((c) => c.internship_id);
      const { data: internships } = await supabase
        .from("internships")
        .select("id, title, description, location, type, industry, skills_required, employer_id, status")
        .in("id", internshipIds)
        .eq("status", "published");

      const { data: employers } = await supabase
        .from("employer_profiles")
        .select("user_id, company_name, logo_url")
        .in("user_id", internships?.map((i) => i.employer_id) || []);

      const employerMap = new Map(employers?.map((e) => [e.user_id, e]) || []);

      const results = cached
        .filter((c) => internships?.some((i) => i.id === c.internship_id))
        .map((c) => {
          const internship = internships!.find((i) => i.id === c.internship_id)!;
          const employer = employerMap.get(internship.employer_id);
          return {
            internship_id: c.internship_id,
            title: internship.title,
            company: employer?.company_name || "Unknown",
            company_logo: employer?.logo_url,
            location: internship.location,
            type: internship.type,
            industry: internship.industry,
            match_score: Number(c.match_score),
            skill_match: Number(c.skill_match_score),
            interest_alignment: Number(c.interest_alignment_score),
            location_match: Number(c.location_match_score),
            explanation: c.explanation,
          };
        });

      return new Response(JSON.stringify({ recommendations: results, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Gather student data ──────────────────────────────────────────────────

    const [profileRes, prefsRes, cultureRes, studentProfileRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", studentId).single(),
      supabase.from("student_preferences").select("*").eq("user_id", studentId).single(),
      supabase.from("student_culture").select("*").eq("user_id", studentId).single(),
      supabase.from("student_profiles").select("*").eq("user_id", studentId).single(),
    ]);

    const profile = profileRes.data;
    const prefs = prefsRes.data;
    const culture = cultureRes.data;
    const studentProfile = studentProfileRes.data;

    if (!studentProfile) {
      return new Response(JSON.stringify({ error: "Student profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch published internships ──────────────────────────────────────────

    const { data: internships, error: intError } = await supabase
      .from("internships")
      .select("*")
      .eq("status", "published")
      .limit(100);

    if (intError || !internships?.length) {
      return new Response(JSON.stringify({ recommendations: [], cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch employer info ──────────────────────────────────────────────────

    const employerIds = [...new Set(internships.map((i) => i.employer_id))];
    const { data: employers } = await supabase
      .from("employer_profiles")
      .select("user_id, company_name, logo_url, industry")
      .in("user_id", employerIds);
    const employerMap = new Map(employers?.map((e) => [e.user_id, e]) || []);

    // ── Get past feedback to deprioritize dismissed internships ──────────────

    const { data: feedback } = await supabase
      .from("recommendation_feedback")
      .select("internship_id, action")
      .eq("student_id", studentId);

    const dismissedIds = new Set(
      feedback?.filter((f) => f.action === "dismissed" || f.action === "ignored").map((f) => f.internship_id) || []
    );

    // ── Calculate match scores ───────────────────────────────────────────────

    const studentSkills = studentProfile.skills || [];
    const studentLocation = studentProfile.location;
    const preferredLocations = prefs?.preferred_locations;

    const scored = internships
      .filter((i) => !dismissedIds.has(i.id))
      .map((internship) => {
        const skill = skillMatchScore(studentSkills, internship.skills_required || []);
        const location = locationMatchScore(studentLocation, preferredLocations, internship.location, internship.type);
        const interest = interestAlignmentScore(prefs, culture, internship);

        const matchScore = 0.45 * skill + 0.25 * interest + 0.20 * location + 0.10 * 0.5; // 0.5 default for semantic (will be enhanced by AI)

        return {
          internship,
          skill,
          location,
          interest,
          matchScore,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 15); // Take top 15 for AI explanation generation

    // ── Use AI to generate explanations for top matches ──────────────────────

    const studentSummary = {
      name: profile?.full_name,
      skills: studentSkills,
      location: studentLocation,
      university: studentProfile.university,
      major: studentProfile.major,
      experience: studentProfile.experience_years,
      preferred_roles: prefs?.preferred_roles,
      career_track: culture?.career_track,
      interests: culture?.tech_interests,
    };

    const topInternships = scored.slice(0, 10).map((s) => ({
      id: s.internship.id,
      title: s.internship.title,
      company: employerMap.get(s.internship.employer_id)?.company_name || "Unknown",
      skills_required: s.internship.skills_required,
      location: s.internship.location,
      type: s.internship.type,
      industry: s.internship.industry,
      description: s.internship.description?.slice(0, 200),
      match_score: Math.round(s.matchScore * 100),
    }));

    let explanations: Record<string, string> = {};

    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an internship recommendation assistant. Given a student profile and their top matched internships, provide a brief personalized explanation (1-2 sentences) for why each internship is a good match. Focus on skill alignment, career goals, and interests. Be encouraging and specific.`,
            },
            {
              role: "user",
              content: `Student profile:\n${JSON.stringify(studentSummary)}\n\nTop matched internships:\n${JSON.stringify(topInternships)}\n\nProvide explanations for each internship match.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "provide_explanations",
                description: "Provide match explanations for each recommended internship",
                parameters: {
                  type: "object",
                  properties: {
                    explanations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          internship_id: { type: "string" },
                          explanation: { type: "string" },
                        },
                        required: ["internship_id", "explanation"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["explanations"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "provide_explanations" } },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          parsed.explanations?.forEach((e: { internship_id: string; explanation: string }) => {
            explanations[e.internship_id] = e.explanation;
          });
        }
      } else {
        console.error("AI gateway error:", aiResponse.status, await aiResponse.text());
      }
    } catch (aiErr) {
      console.error("AI explanation error:", aiErr);
      // Continue without AI explanations — use fallback
    }

    // ── Build final results ──────────────────────────────────────────────────

    const results = scored.slice(0, 10).map((s) => {
      const employer = employerMap.get(s.internship.employer_id);
      const fallbackExplanation = `Matches ${Math.round(s.skill * 100)}% of required skills${s.interest > 0.5 ? " and aligns with your career interests" : ""}.`;

      return {
        internship_id: s.internship.id,
        title: s.internship.title,
        company: employer?.company_name || "Unknown",
        company_logo: employer?.logo_url,
        location: s.internship.location,
        type: s.internship.type,
        industry: s.internship.industry,
        match_score: Math.round(s.matchScore * 100),
        skill_match: Math.round(s.skill * 100),
        interest_alignment: Math.round(s.interest * 100),
        location_match: Math.round(s.location * 100),
        explanation: explanations[s.internship.id] || fallbackExplanation,
      };
    });

    // ── Cache results ────────────────────────────────────────────────────────

    if (results.length > 0) {
      // Clear old cache
      await supabase.from("recommendation_cache").delete().eq("student_id", studentId);

      const cacheRows = results.map((r) => ({
        student_id: studentId,
        internship_id: r.internship_id,
        match_score: r.match_score,
        skill_match_score: r.skill_match,
        interest_alignment_score: r.interest_alignment,
        location_match_score: r.location_match,
        explanation: r.explanation,
      }));

      await supabase.from("recommendation_cache").insert(cacheRows);
    }

    return new Response(JSON.stringify({ recommendations: results, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Recommendation error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
