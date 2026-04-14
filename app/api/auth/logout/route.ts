import { NextResponse } from "next/server";

import { coreApiFetch } from "@/lib/api/core-api";
import { clearSession, getSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();

  try {
    if (session) {
      await coreApiFetch("/api/v1/users/logout", {
        method: "POST",
        token: session.token,
      });
    }
  } catch {
    // 브라우저 세션은 항상 정리하되, 백엔드 로그아웃 실패는 화면 흐름을 막지 않습니다.
  } finally {
    await clearSession();
  }

  return NextResponse.json({ ok: true });
}
