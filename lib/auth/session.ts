import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Session, UserRole } from "@/lib/types";

const SESSION_COOKIE_NAME = "notebooklm_session";

function isUserRole(value: unknown): value is UserRole {
  return value === "USER" || value === "ADMIN";
}

export function getHomePathByRole(role: UserRole) {
  return role === "ADMIN" ? "/admin" : "/workspace";
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<Session>;

    if (
      typeof parsed.token !== "string" ||
      typeof parsed.userId !== "number" ||
      !isUserRole(parsed.role)
    ) {
      return null;
    }

    return {
      token: parsed.token,
      refreshToken:
        typeof parsed.refreshToken === "string" ? parsed.refreshToken : undefined,
      userId: parsed.userId,
      role: parsed.role,
    };
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

export async function requireUserSession() {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/admin");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();

  if (session.role !== "ADMIN") {
    redirect(getHomePathByRole(session.role));
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
