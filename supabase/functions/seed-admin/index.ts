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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const email = "admin@formandolideres.org";
    const password = "AdminPFL@1810";

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);

    if (existing) {
      // Ensure role exists
      const { data: roleCheck } = await adminClient.from("user_roles").select("id").eq("user_id", existing.id).eq("role", "admin");
      if (!roleCheck || roleCheck.length === 0) {
        await adminClient.from("user_roles").insert({ user_id: existing.id, role: "admin" });
      }
      return new Response(JSON.stringify({ message: "Admin already exists", user_id: existing.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create admin user
    const { data: newUser, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Administrador" },
    });

    if (error || !newUser.user) {
      return new Response(JSON.stringify({ error: error?.message || "Failed" }), { status: 500, headers: corsHeaders });
    }

    // Assign admin role
    await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });

    return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
