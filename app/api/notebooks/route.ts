import { NextResponse } from "next/server";

import { createNotebook, fetchNotebooks } from "@/lib/api/core-api";
import { requireUserSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireUserSession();
    const notebooks = await fetchNotebooks(session.userId, session.token);

    return NextResponse.json({ ok: true, notebooks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "노트북 목록 조회에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const body = (await request.json()) as { title?: string };
    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "노트북 제목을 입력해 주세요." },
        { status: 400 },
      );
    }

    const created = await createNotebook(title);

    return NextResponse.json({ ok: true, notebook: created });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "노트북 생성에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
