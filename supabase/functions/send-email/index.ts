import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const emailSchema = z.object({
  to: z.string().email("to must be a valid email").min(1),
  subject: z.string().min(1, "subject is required").max(500),
  html: z.string().min(1, "html is required").max(100000),
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

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

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
    .eq("function_name", "send_email")
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
      {
        user_id: userId,
        function_name: "send_email",
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
    // JWT auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: responseHeaders,
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

    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    const userId = claimsData.claims.sub as string;

    // Rate limiting
    const rateCheck = await checkRateLimit(supabaseAdmin, userId);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", retryAfter: 3600 }),
        { status: 429, headers: responseHeaders }
      );
    }

    // Validate input
    const body = await req.json();
    const parsed = emailSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: parsed.error.issues.map((i) => i.message).join(", "),
        }),
        { status: 400, headers: responseHeaders }
      );
    }

    const { to, subject, html } = parsed.data;

    // Send via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: responseHeaders }
      );
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Wroob <noreply@wroob.in>",
        to: [to],
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      return new Response(JSON.stringify(resendData), {
        status: resendRes.status,
        headers: responseHeaders,
      });
    }

    return new Response(JSON.stringify(resendData), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: responseHeaders }
    );
  }
});
