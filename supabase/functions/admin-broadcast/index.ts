import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const broadcastSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required").max(2000),
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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user
    const authClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    // Check admin role
    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: responseHeaders,
      });
    }

    // Validate input
    const body = await req.json();
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: responseHeaders }
      );
    }

    const { title, message } = parsed.data;

    // Get all user IDs
    const { data: allRoles, error: rolesError } = await serviceClient
      .from("user_roles")
      .select("user_id");

    if (rolesError) {
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        status: 500,
        headers: responseHeaders,
      });
    }

    // Deduplicate user IDs
    const userIds = [...new Set(allRoles.map((r: any) => r.user_id))];

    // Insert notifications in batches of 500
    const batchSize = 500;
    let inserted = 0;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize).map((uid) => ({
        user_id: uid,
        title,
        message,
        type: "general" as const,
        read: false,
      }));

      const { error: insertError } = await serviceClient
        .from("notifications")
        .insert(batch);

      if (insertError) {
        console.error("Batch insert error:", insertError);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, notified: inserted }),
      { status: 200, headers: responseHeaders }
    );
  } catch (err) {
    console.error("Broadcast error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: responseHeaders,
    });
  }
});
