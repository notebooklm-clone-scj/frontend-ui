import { NextResponse } from "next/server";

import { askNotebookQuestionForCurrentUser, fetchChatHistory } from "@/lib/api/core-api";
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

export async function GET(_: Request, context: RouteContext) {
  try {
    const session = await requireUserSession();
    const { id } = await context.params;
    const notebookId = parseNotebookId(id);
    const history = await fetchChatHistory(notebookId, session.token);

    return NextResponse.json({ ok: true, history });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "채팅 이력 조회에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireUserSession();
    const { id } = await context.params;
    const notebookId = parseNotebookId(id);
    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        { ok: false, message: "질문을 입력해 주세요." },
        { status: 400 },
      );
    }

    const response = await askNotebookQuestionForCurrentUser(notebookId, question);

    return NextResponse.json({ ok: true, response });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "채팅 요청에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
