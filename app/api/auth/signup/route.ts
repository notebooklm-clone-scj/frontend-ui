import { NextResponse } from "next/server";

import { signupViaCoreApi } from "@/lib/api/core-api";
import type { SignupPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SignupPayload;
    const response = await signupViaCoreApi(payload);

    return NextResponse.json({
      ok: true,
      id: response.id,
      message: response.message,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "회원가입 처리에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
