import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const DEFAULT_ALLOWED_ORIGINS = ["https://alpha-sec.vercel.app"];
const CORS_ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type";
const CORS_ALLOWED_METHODS = "POST, OPTIONS";

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  const parsed = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
}

const ALLOWED_ORIGINS = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS"));

function isAllowedOrigin(origin: string | null): origin is string {
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}

function buildCorsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": CORS_ALLOWED_METHODS,
    Vary: "Origin",
  });

  if (isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function jsonResponse(origin: string | null, status: number, body: unknown): Response {
  const headers = buildCorsHeaders(origin);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (!isAllowedOrigin(origin)) {
    return jsonResponse(origin, 403, { error: "Origin not allowed" });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: buildCorsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse(origin, 405, { error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(origin, 401, { error: "Missing authorization header" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(origin, 500, { error: "Missing required Supabase environment variables" });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(origin, 401, { error: "Invalid or expired token" });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const cleanupSteps: Array<{ table: string; column: string }> = [
      { table: "audit_logs", column: "user_id" },
      { table: "custom_systems", column: "created_by" },
      { table: "custom_fleets", column: "created_by" },
      { table: "custom_factions", column: "created_by" },
      { table: "app_settings", column: "updated_by" },
    ];

    for (const step of cleanupSteps) {
      const { error } = await adminClient
        .from(step.table)
        .update({ [step.column]: null })
        .eq(step.column, user.id);

      if (error) {
        return jsonResponse(origin, 500, {
          error: `Failed to clean up references in ${step.table}.${step.column}: ${error.message}`,
        });
      }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return jsonResponse(origin, 500, { error: deleteError.message });
    }

    return jsonResponse(origin, 200, { success: true });
  } catch (err) {
    return jsonResponse(origin, 500, {
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});
