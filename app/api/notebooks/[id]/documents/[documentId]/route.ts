import { NextResponse } from "next/server";

import { deleteDocument } from "@/lib/api/core-api";
import { requireUserSession } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

function parseId(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`유효하지 않은 ${label}입니다.`);
  }

  return parsed;
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    await requireUserSession();
    const { id, documentId } = await context.params;
    const notebookId = parseId(id, "노트북 ID");
    const targetDocumentId = parseId(documentId, "문서 ID");
    const message = await deleteDocument(notebookId, targetDocumentId);

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "문서 삭제에 실패했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
