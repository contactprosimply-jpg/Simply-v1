import { apiOk } from "@/lib/api-response";
import { getMissingSupabaseEnvVars, isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const missing = getMissingSupabaseEnvVars();
  return apiOk({
    configured: isSupabaseConfigured(),
    missing,
    hasDefaultOwner: Boolean(process.env.SUPABASE_DEFAULT_OWNER_ID),
  });
}
