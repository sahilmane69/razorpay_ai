import "server-only";

import { createClient } from "@/utils/supabase/server";

export class AuthError extends Error {
  constructor(message = "Please sign in to continue.") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getAuthenticatedBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthError();
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, owner_name, owner_user_id, created_at")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (businessError || !business) {
    throw new AuthError("No business is linked to this account.");
  }

  return { user, business, supabase };
}
