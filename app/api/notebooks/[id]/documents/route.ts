import { NextResponse } from "next/server";

import { coreApiFetch, fetchDocuments } from "@/lib/api/core-api";
import { requireSession } from "@/lib/auth/session";

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
    const session = await requireSession();
    const { id } = await context.params;
    const notebookId = parseNotebookId(id);
    const documents = await fetchDocuments(notebookId, session.token);

    return NextResponse.json({ ok: true, documents });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "문서 목록 조회에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const notebookId = parseNotebookId(id);
    const incomingFormData = await request.formData();
    const file = incomingFormData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "PDF 파일을 선택해 주세요." },
        { status: 400 },
      );
    }

    const outgoingFormData = new FormData();
    outgoingFormData.append("file", file);

    const response = await coreApiFetch(`/api/v1/notebooks/${notebookId}/documents`, {
      method: "POST",
      body: outgoingFormData,
      token: session.token,
    });

    const documentId = Number(await response.text());

    if (!Number.isFinite(documentId)) {
      throw new Error("문서 생성 응답에서 ID를 읽지 못했습니다.");
    }

    return NextResponse.json({ ok: true, documentId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "문서 업로드에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
