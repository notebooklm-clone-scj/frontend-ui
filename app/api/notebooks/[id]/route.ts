import { NextResponse } from "next/server";

import { deleteNotebook, updateNotebookTitle } from "@/lib/api/core-api";
import { requireUserSession } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseNotebookId(id: string) {
  const notebookId = Number(id);

  if (!Number.isFinite(notebookId)) {
    throw new Error("유효하지 않은 노트북 ID입니다.");
  }

  return notebookId;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireUserSession();
    const { id } = await context.params;
    const notebookId = parseNotebookId(id);
    const body = (await request.json()) as { title?: string };
    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "노트북 제목을 입력해 주세요." },
        { status: 400 },
      );
    }

    const message = await updateNotebookTitle(notebookId, title);

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "노트북 이름 변경에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    await requireUserSession();
    const { id } = await context.params;
    const notebookId = parseNotebookId(id);
    const message = await deleteNotebook(notebookId);

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "노트북 삭제에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
