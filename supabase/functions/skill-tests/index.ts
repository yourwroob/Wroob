import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limit: 15 requests per hour per user
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_FN_NAME = "skill_tests";

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

// Simple skill test questions
const SKILL_TESTS: Record<string, { questions: { q: string; options: string[]; answer: number }[] }> = {
  JavaScript: {
    questions: [
      { q: "What does 'typeof null' return?", options: ["null", "object", "undefined", "number"], answer: 1 },
      { q: "Which method converts JSON to a JS object?", options: ["JSON.stringify()", "JSON.parse()", "JSON.convert()", "JSON.toObject()"], answer: 1 },
      { q: "What is the output of '2' + 2?", options: ["4", "22", "NaN", "Error"], answer: 1 },
      { q: "Which keyword declares a block-scoped variable?", options: ["var", "let", "both", "neither"], answer: 1 },
      { q: "What does Array.prototype.map() return?", options: ["undefined", "the original array", "a new array", "a boolean"], answer: 2 },
    ],
  },
  React: {
    questions: [
      { q: "What hook manages state in functional components?", options: ["useEffect", "useState", "useContext", "useRef"], answer: 1 },
      { q: "What is JSX?", options: ["A database", "A syntax extension for JS", "A CSS framework", "A testing library"], answer: 1 },
      { q: "Which hook handles side effects?", options: ["useState", "useMemo", "useEffect", "useCallback"], answer: 2 },
      { q: "What does React.memo do?", options: ["Memoizes state", "Prevents re-renders", "Creates refs", "Handles errors"], answer: 1 },
      { q: "What is the virtual DOM?", options: ["A browser API", "A lightweight copy of the real DOM", "A database", "A CSS engine"], answer: 1 },
    ],
  },
  Python: {
    questions: [
      { q: "Which keyword defines a function in Python?", options: ["function", "func", "def", "define"], answer: 2 },
      { q: "What is a list comprehension?", options: ["A loop", "A concise way to create lists", "A class method", "A module"], answer: 1 },
      { q: "What does 'len()' do?", options: ["Creates a list", "Returns length", "Loops over items", "Sorts items"], answer: 1 },
      { q: "Which is immutable?", options: ["list", "dict", "tuple", "set"], answer: 2 },
      { q: "How do you handle exceptions?", options: ["if/else", "try/except", "for/while", "switch/case"], answer: 1 },
    ],
  },
  "Data Structures": {
    questions: [
      { q: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: 1 },
      { q: "Which data structure uses FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], answer: 1 },
      { q: "What is a hash table's average lookup time?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], answer: 2 },
      { q: "Which traversal visits root first?", options: ["Inorder", "Preorder", "Postorder", "Level order"], answer: 1 },
      { q: "What data structure uses LIFO?", options: ["Queue", "Stack", "Heap", "Graph"], answer: 1 },
    ],
  },
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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // ── Rate Limit Check ──────────────────────────────────────────────────
    const rateLimitAdmin = createClient(supabaseUrl, serviceKey);
    const rateLimitResult = await checkRateLimit(rateLimitAdmin, user.id);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", retryAfter: 3600 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    // Get available tests
    if (action === "list_tests") {
      // Check which tests student already passed
      const serviceClient = createClient(supabaseUrl, serviceKey);
      const { data: results } = await serviceClient
        .from("skill_test_results")
        .select("skill_name, score, passed, created_at")
        .eq("student_id", user.id);

      const resultMap = new Map(results?.map((r) => [r.skill_name, r]) || []);

      const tests = Object.keys(SKILL_TESTS).map((name) => ({
        skill_name: name,
        question_count: SKILL_TESTS[name].questions.length,
        completed: resultMap.has(name),
        passed: resultMap.get(name)?.passed || false,
        score: resultMap.get(name)?.score || null,
        completed_at: resultMap.get(name)?.created_at || null,
      }));

      return new Response(JSON.stringify({ tests }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get test questions (without answers)
    if (action === "get_test") {
      const { skill_name } = body;
      const test = SKILL_TESTS[skill_name];
      if (!test) {
        return new Response(JSON.stringify({ error: "Test not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if already passed (can only retake if failed)
      const serviceClient = createClient(supabaseUrl, serviceKey);
      const { data: existing } = await serviceClient
        .from("skill_test_results")
        .select("passed")
        .eq("student_id", user.id)
        .eq("skill_name", skill_name)
        .single();

      if (existing?.passed) {
        return new Response(JSON.stringify({ error: "You already passed this test" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const questions = test.questions.map((q, i) => ({
        index: i,
        question: q.q,
        options: q.options,
      }));

      return new Response(JSON.stringify({ skill_name, questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Submit test answers
    if (action === "submit_test") {
      const { skill_name, answers } = body;
      const test = SKILL_TESTS[skill_name];
      if (!test) {
        return new Response(JSON.stringify({ error: "Test not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!answers || answers.length !== test.questions.length) {
        return new Response(JSON.stringify({ error: "Must answer all questions" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Grade
      let correct = 0;
      test.questions.forEach((q, i) => {
        if (answers[i] === q.answer) correct++;
      });
      const score = Math.round((correct / test.questions.length) * 100);
      const passed = score >= 60;

      const serviceClient = createClient(supabaseUrl, serviceKey);

      // Check if already passed
      const { data: existing } = await serviceClient
        .from("skill_test_results")
        .select("passed")
        .eq("student_id", user.id)
        .eq("skill_name", skill_name)
        .single();

      if (existing?.passed) {
        return new Response(JSON.stringify({ error: "Already passed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert result
      await serviceClient.from("skill_test_results").upsert({
        student_id: user.id,
        skill_name,
        score,
        passed,
      }, { onConflict: "student_id,skill_name" });

      // Recalculate reputation
      await serviceClient.rpc("update_student_reputation", { _student_id: user.id });

      return new Response(JSON.stringify({ score, passed, correct, total: test.questions.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Skill test error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
