import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Session } from "@/lib/types";

const SESSION_COOKIE_NAME = "notebooklm_session";

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as Session;
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function saveSession(session: Session) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
