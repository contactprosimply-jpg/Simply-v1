import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function getOptionalUserId(): Promise<string | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

export function requireSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase non configuré (variables d'environnement manquantes).",
      code: "SUPABASE_NOT_CONFIGURED",
      status: 503,
    } as const;
  }
  return null;
}
