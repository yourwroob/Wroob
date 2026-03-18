import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "admin@test.com";
    const password = "Admin1234!";

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === email);

    let userId: string;

    if (existing) {
      userId = existing.id;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Admin User", role: "admin" },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Ensure admin role exists
    const { data: roleExists } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleExists) {
      // Delete any existing role first
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
    }

    // Ensure profile exists
    const { data: profileExists } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profileExists) {
      await supabaseAdmin.from("profiles").insert({ user_id: userId, full_name: "Admin User" });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Admin account ready", email, password }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
