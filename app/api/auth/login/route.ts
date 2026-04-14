import { NextResponse } from "next/server";

import { loginViaCoreApi } from "@/lib/api/core-api";
import { getUserIdFromToken } from "@/lib/auth/jwt";
import { saveSession } from "@/lib/auth/session";
import type { LoginPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LoginPayload;
    const response = await loginViaCoreApi(payload);
    const userId = getUserIdFromToken(response.token);

    await saveSession({
      token: response.token,
      refreshToken: response.refreshToken,
      userId,
      role: response.role,
    });

    return NextResponse.json({ ok: true, userId, role: response.role });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "로그인 처리에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
