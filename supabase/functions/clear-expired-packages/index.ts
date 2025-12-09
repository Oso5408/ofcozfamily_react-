// =============================================
// Supabase Edge Function: Clear Expired Packages
// =============================================
// Runs daily to automatically clear expired BR15, BR30, and DP20 packages
// =============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("🚀 Starting expired packages cleanup...");

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("📡 Connected to Supabase");

    // Run the batch clear function
    const { data, error } = await supabaseClient.rpc("clear_all_expired_packages");

    if (error) {
      console.error("❌ Error clearing packages:", error);
      throw error;
    }

    console.log("✅ Cleared expired packages:", data);

    // Prepare summary
    const summary = {
      totalUsers: data?.length || 0,
      details: data || [],
      timestamp: new Date().toISOString(),
    };

    // Count total packages cleared by type
    const totals = {
      br15: 0,
      br30: 0,
      dp20: 0,
    };

    if (data) {
      data.forEach((user: any) => {
        totals.br15 += user.br15_cleared || 0;
        totals.br30 += user.br30_cleared || 0;
        totals.dp20 += user.dp20_cleared || 0;
      });
    }

    summary.totals = totals;

    console.log("📊 Summary:", {
      users: summary.totalUsers,
      br15_cleared: totals.br15,
      br30_cleared: totals.br30,
      dp20_cleared: totals.dp20,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleared expired packages for ${summary.totalUsers} users`,
        summary,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
