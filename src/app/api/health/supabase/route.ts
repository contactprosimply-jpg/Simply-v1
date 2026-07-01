import { apiOk } from "@/lib/api-response";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiOk({ configured: isSupabaseConfigured() });
}
