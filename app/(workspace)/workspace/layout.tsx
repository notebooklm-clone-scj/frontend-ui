import type { ReactNode } from "react";

import { requireUserSession } from "@/lib/auth/session";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUserSession();

  return children;
}
