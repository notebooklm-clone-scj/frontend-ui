import { redirect } from "next/navigation";

import { getHomePathByRole, getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();

  redirect(session ? getHomePathByRole(session.role) : "/login");
}
