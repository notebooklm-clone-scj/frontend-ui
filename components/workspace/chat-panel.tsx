"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { formatKoreanDateTime } from "@/lib/format/date";
import type {
  ChatHistoryReference,
  ChatHistoryItem,
  NotebookChatResponse,
  ReferenceChunk,
} from "@/lib/types";

type ChatPanelProps = {
  notebookId: number;
  history: ChatHistoryItem[];
  onHistoryChange: (history: ChatHistoryItem[]) => void;
};

function buildClientTimestamp() {
  return new Date().toISOString();
}

function getHistoryItemKey(item: ChatHistoryItem) {
  return `${item.role}-${item.createdAt}-${item.message}`;
}

function toHistoryReferences(chunks: ReferenceChunk[]): ChatHistoryReference[] {
  return chunks.map((chunk) => ({
    documentId: chunk.document_id,
    documentTitle: chunk.document_title,
    sectionTitle: chunk.section_title,
    pageNumber: chunk.page_number,
    chunkIndex: chunk.chunk_index,
    pageChunkIndex: chunk.page_chunk_index,
    content: chunk.content,
  }));
}

function getReferenceTitle(chunk: ChatHistoryReference) {
  const documentTitle = chunk.documentTitle ?? "문서명 없음";
  const sectionTitle = chunk.sectionTitle ? ` · ${chunk.sectionTitle}` : "";

  return `${documentTitle}${sectionTitle}`;
}

function getReferenceMeta(chunk: ChatHistoryReference) {
  const parts = [`${chunk.pageNumber} page`];

  if (typeof chunk.chunkIndex === "number") {
    parts.push(`문서 청크 ${chunk.chunkIndex + 1}`);
  }

  if (typeof chunk.pageChunkIndex === "number") {
    parts.push(`페이지 청크 ${chunk.pageChunkIndex + 1}`);
  }

  return parts.join(" · ");
}

export function ChatPanel({
  notebookId,
  history,
  onHistoryChange,
}: ChatPanelProps) {
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [referenceMap, setReferenceMap] = useState<Record<string, ChatHistoryReference[]>>(
    {},
  );
  const [openReferenceKeys, setOpenReferenceKeys] = useState<string[]>([]);

  useEffect(() => {
    const container = chatHistoryRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [history, isPending]);

  async function refreshHistory() {
    const response = await fetch(`/api/notebooks/${notebookId}/chat`);
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      history?: ChatHistoryItem[];
    };

    if (!response.ok || !result.ok || !result.history) {
      throw new Error(result.message ?? "채팅 이력을 불러오지 못했습니다.");
    }

    const nextHistory = result.history;

    onHistoryChange(nextHistory);

    // 서버에서 내려준 references가 있으면 임시 fallback 맵은 비워도 됩니다.
    setReferenceMap((currentMap) => {
      const nextMap = { ...currentMap };

      for (const item of nextHistory) {
        const itemKey = getHistoryItemKey(item);

        if (item.references?.length) {
          delete nextMap[itemKey];
        }
      }

      return nextMap;
    });

    return nextHistory;
  }

  function attachReferencesToHistory(
    nextHistory: ChatHistoryItem[],
    nextResponse: NotebookChatResponse,
  ) {
    if (!nextResponse.reference_chunks.length) {
      return;
    }

    const referenceIndex = [...nextHistory]
      .reverse()
      .findIndex(
        (item) => item.role === "AI" && item.message === nextResponse.answer,
      );

    if (referenceIndex === -1) {
      return;
    }

    const historyIndex = nextHistory.length - 1 - referenceIndex;
    const itemKey = getHistoryItemKey(nextHistory[historyIndex]);

    setReferenceMap((currentMap) => ({
      ...currentMap,
      [itemKey]: toHistoryReferences(nextResponse.reference_chunks),
    }));
    setOpenReferenceKeys((currentKeys) =>
      currentKeys.includes(itemKey) ? currentKeys : [...currentKeys, itemKey],
    );
  }

  function toggleReferences(itemKey: string) {
    setOpenReferenceKeys((currentKeys) =>
      currentKeys.includes(itemKey)
        ? currentKeys.filter((key) => key !== itemKey)
        : [...currentKeys, itemKey],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("질문을 입력해 주세요.");
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const optimisticHistory = [
        ...history,
        {
          role: "USER",
          message: trimmedQuestion,
          createdAt: buildClientTimestamp(),
        },
      ];
      onHistoryChange(optimisticHistory);
      setQuestion("");

      const response = await fetch(`/api/notebooks/${notebookId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        response?: NotebookChatResponse;
      };

      if (!response.ok || !result.ok || !result.response) {
        throw new Error(result.message ?? "채팅 요청에 실패했습니다.");
      }

      try {
        const refreshedHistory = await refreshHistory();
        attachReferencesToHistory(refreshedHistory, result.response);
      } catch {
        const fallbackHistory = [
          ...optimisticHistory,
          {
            role: "AI",
            message: result.response.answer,
            createdAt: buildClientTimestamp(),
          },
        ];

        onHistoryChange(fallbackHistory);
        attachReferencesToHistory(fallbackHistory, result.response);
      }
    } catch (chatError) {
      setError(
        chatError instanceof Error
          ? chatError.message
          : "채팅 요청 처리 중 오류가 발생했습니다.",
      );
      await refreshHistory().catch(() => undefined);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <article className="panel chat-panel">
      <div className="section-heading">
        <div className="sidebar-section-header">
          <h3 className="panel-title">Notebook Chat</h3>
        </div>
      </div>

      <div className="chat-history" ref={chatHistoryRef}>
        {history.length === 0 ? (
          <div className="empty-card">
            <h3>아직 대화가 없습니다.</h3>
            <p>오른쪽 문서 내용을 바탕으로 첫 질문을 보내 보세요.</p>
          </div>
        ) : (
          history.map((item) => {
            const itemKey = getHistoryItemKey(item);
            const references = item.references?.length
              ? item.references
              : (referenceMap[itemKey] ?? []);
            const isReferenceOpen = openReferenceKeys.includes(itemKey);

            return (
              <article
                className={`chat-bubble ${item.role === "AI" ? "ai" : "user"}`.trim()}
                key={itemKey}
              >
                <div className="chat-bubble-head">
                  <strong>{item.role === "AI" ? "AI" : "USER"}</strong>
                  {item.role === "AI" && references.length ? (
                    <button
                      className={`inline-reference-button ${
                        isReferenceOpen ? "open" : ""
                      }`.trim()}
                      onClick={() => toggleReferences(itemKey)}
                      type="button"
                    >
                      근거 {references.length}
                    </button>
                  ) : null}
                </div>
                <p>{item.message}</p>
                <span>{formatKoreanDateTime(item.createdAt)}</span>

                {item.role === "AI" && isReferenceOpen && references.length ? (
                  <div className="inline-reference-list">
                    {references.map((chunk, referenceIndex) => (
                      <article
                        className="reference-card"
                        key={`${chunk.documentId ?? "document"}-${chunk.pageNumber}-${
                          chunk.chunkIndex ?? referenceIndex
                        }`}
                      >
                        <div className="reference-card-head">
                          <strong>{getReferenceTitle(chunk)}</strong>
                          <span>{getReferenceMeta(chunk)}</span>
                        </div>
                        <p>{chunk.content}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      <form className="chat-compose" onSubmit={handleSubmit}>
        <div className="chat-compose-shell">
          <textarea
            className="chat-textarea"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="이 노트북의 문서를 바탕으로 궁금한 점을 물어보세요."
            rows={3}
            value={question}
          />
          <button className="chat-submit-button" disabled={isPending} type="submit">
            {isPending ? (
              <>
                <span aria-hidden="true" className="spinner" />
                생성 중
              </>
            ) : (
              <>
                <span aria-hidden="true">↗</span>
                보내기
              </>
            )}
          </button>
        </div>
      </form>

      {error ? <p className="status-text error">{error}</p> : null}
      {isPending ? (
        <p className="status-text">AI가 답변을 작성하는 중입니다. 잠시만 기다려 주세요.</p>
      ) : null}
    </article>
  );
}
