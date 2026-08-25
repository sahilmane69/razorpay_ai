import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/session";

export function userError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof AuthError) {
    return userError(error.message, 401);
  }
  console.error(error);
  return userError("Something went wrong. Please try again.", 500);
}
