"use client";

import { useCallback, useEffect, useState } from "react";

import { ChatPanel } from "@/components/workspace/chat-panel";
import { DocumentUploadPanel } from "@/components/workspace/document-upload-panel";
import { formatKoreanDate } from "@/lib/format/date";
import type { ChatHistoryItem, DocumentItem, Notebook } from "@/lib/types";

type NotebookStudioProps = {
  notebook: Notebook;
  initialDocuments: DocumentItem[];
  initialChatHistory: ChatHistoryItem[];
};

function isDocumentStillProcessing(document: DocumentItem) {
  return !document.summary;
}

export function NotebookStudio({
  notebook,
  initialDocuments,
  initialChatHistory,
}: NotebookStudioProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>(initialChatHistory);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [isRefreshingDocuments, setIsRefreshingDocuments] = useState(false);

  const refreshDocuments = useCallback(async () => {
    setIsRefreshingDocuments(true);

    try {
      const response = await fetch(`/api/notebooks/${notebook.id}/documents`);
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        documents?: DocumentItem[];
      };

      if (!response.ok || !result.ok || !result.documents) {
        throw new Error(result.message ?? "문서 목록 조회에 실패했습니다.");
      }

      setDocuments(result.documents);
      setDocumentsError(null);
    } catch (error) {
      setDocumentsError(
        error instanceof Error
          ? error.message
          : "문서 목록을 새로고침하지 못했습니다.",
      );
    } finally {
      setIsRefreshingDocuments(false);
    }
  }, [notebook.id]);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  useEffect(() => {
    if (!selectedDocumentId) {
      return;
    }

    const selectedStillExists = documents.some(
      (document) => document.id === selectedDocumentId,
    );

    if (!selectedStillExists) {
      setSelectedDocumentId(null);
    }
  }, [documents, selectedDocumentId]);

  useEffect(() => {
    setChatHistory(initialChatHistory);
  }, [initialChatHistory]);

  useEffect(() => {
    if (!documents.some(isDocumentStillProcessing)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshDocuments();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [documents, refreshDocuments]);

  function handleUploaded() {
    void refreshDocuments();
  }

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? null;

  return (
    <section className="studio-layout">
      <div className="studio-main">
        <ChatPanel
          history={chatHistory}
          notebookId={notebook.id}
          onHistoryChange={setChatHistory}
        />
      </div>

      <aside className="studio-side">
        <article className="panel">
          <DocumentUploadPanel notebookId={notebook.id} onUploaded={handleUploaded} />
        </article>

        <article className="panel side-documents">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Documents</span>
            </div>
            <div className="button-row">
              <button
                aria-label="문서 새로고침"
                className="icon-button"
                onClick={() => void refreshDocuments()}
                title="문서 새로고침"
                type="button"
              >
                {isRefreshingDocuments ? "..." : "↻"}
              </button>
            </div>
          </div>

          {documentsError ? <p className="status-text error">{documentsError}</p> : null}

          {documents.length === 0 ? (
            <div className="empty-card">
              <h3>아직 업로드된 문서가 없습니다.</h3>
              <p>첫 PDF를 업로드하면 서버 문서 목록에 즉시 등록됩니다.</p>
            </div>
          ) : (
            <div className="doc-list">
              {documents.map((document) => {
                const isProcessing = isDocumentStillProcessing(document);
                const isSelected = selectedDocumentId === document.id;

                return (
                  <button
                    className={`doc-card doc-select-card ${
                      isSelected ? "selected" : ""
                    }`.trim()}
                    key={document.id}
                    onClick={() =>
                      setSelectedDocumentId((currentSelectedId) =>
                        currentSelectedId === document.id ? null : document.id,
                      )
                    }
                    type="button"
                  >
                    <strong>{document.filename}</strong>
                    <div className="doc-meta-row">
                      <span
                        aria-label={isProcessing ? "PROCESSING" : "COMPLETED"}
                        className={`status-dot ${isProcessing ? "processing" : "completed"}`.trim()}
                        title={isProcessing ? "PROCESSING" : "COMPLETED"}
                      />
                      <span className="pill">{formatKoreanDate(document.createdAt)}</span>
                      {document.totalPages > 0 ? (
                        <span className="pill">{document.totalPages} pages</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="selected-document-panel">
            {!selectedDocument ? (
              <div className="empty-card">
                <h3>문서를 선택해 주세요.</h3>
                <p>
                  목록에서 문서를 클릭하면 이 영역에 해당 문서의 요약과 상태가
                  표시됩니다.
                </p>
              </div>
            ) : (
              <article className="doc-summary-panel">
                <strong>{selectedDocument.filename}</strong>
                <div className="doc-meta-row">
                  <span
                    aria-label={
                      isDocumentStillProcessing(selectedDocument)
                        ? "PROCESSING"
                        : "COMPLETED"
                    }
                    className={`status-dot ${
                      isDocumentStillProcessing(selectedDocument)
                        ? "processing"
                        : "completed"
                    }`.trim()}
                    title={
                      isDocumentStillProcessing(selectedDocument)
                        ? "PROCESSING"
                        : "COMPLETED"
                    }
                  />
                  <span className="pill">
                    {formatKoreanDate(selectedDocument.createdAt)}
                  </span>
                  {selectedDocument.totalPages > 0 ? (
                    <span className="pill">
                      {selectedDocument.totalPages} pages
                    </span>
                  ) : null}
                </div>
                <p className="doc-summary">
                  {selectedDocument.summary ??
                    "요약이 아직 준비되지 않았습니다. 비동기 분석이 완료되면 이 영역에 내용이 채워집니다."}
                </p>
              </article>
            )}
          </div>
        </article>
      </aside>
    </section>
  );
}
