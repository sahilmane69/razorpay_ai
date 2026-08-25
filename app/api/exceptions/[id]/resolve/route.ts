import { getAuthenticatedBusiness } from "@/lib/auth/session";
import { handleRouteError, userError } from "@/lib/api/errors";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { business, supabase } = await getAuthenticatedBusiness();
    const params = ParamsSchema.safeParse(await context.params);
    if (!params.success) {
      return userError("That exception could not be found.");
    }

    const { data: exception } = await supabase
      .from("exceptions")
      .select("id, status")
      .eq("id", params.data.id)
      .eq("business_id", business.id)
      .maybeSingle();

    if (!exception) {
      return userError("That exception could not be found.");
    }

    const { error } = await supabase
      .from("exceptions")
      .update({
        status: "RESOLVED",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", exception.id)
      .eq("business_id", business.id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
