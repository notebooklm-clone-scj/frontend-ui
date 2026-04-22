"use client";

import { ChangeEvent, FormEvent, useState } from "react";

const MAX_UPLOAD_FILE_SIZE_MB = 2;
const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;

type DocumentUploadPanelProps = {
  notebookId: number;
  onUploaded: (documentId: number) => void;
};

export function DocumentUploadPanel({
  notebookId,
  onUploaded,
}: DocumentUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (selectedFile && selectedFile.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      setFile(null);
      setStatus(null);
      setError(
        `무료 티어 환경에서는 ${MAX_UPLOAD_FILE_SIZE_MB}MB 이하 PDF만 업로드할 수 있습니다.`,
      );
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setError(null);
    setStatus(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("업로드할 PDF를 선택해 주세요.");
      return;
    }

    setIsPending(true);
    setError(null);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/notebooks/${notebookId}/documents`, {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        documentId?: number;
      };

      if (!response.ok || !result.ok || !result.documentId) {
        throw new Error(result.message ?? "문서 업로드에 실패했습니다.");
      }

      setStatus(
        `문서가 등록되었습니다. 문서 ID ${result.documentId}번으로 비동기 분석을 시작합니다.`,
      );
      onUploaded(result.documentId);
      setFile(null);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "문서 업로드 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="form-grid">
      <div className="panel-section-copy">
        <div className="sidebar-section-header">
          <h3 className="panel-title">Document Upload</h3>
        </div>
        <p className="helper-note">
          업로드 직후에는 문서가 먼저 생성되고, 요약은 문서 목록을 다시 불러오면서
          반영됩니다. 노트북당 3개, 계정 전체 기준 5개까지만 등록할 수 있습니다.
          무료 티어 환경에서는 2MB 이하, 30페이지 이하 PDF 업로드를 권장합니다.
        </p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="upload-dropzone">
          <div>
            <h3>{file ? file.name : "PDF 파일 선택"}</h3>
            <p className="helper-note">
              지금 구조는 Spring이 업로드 입구를 맡고, FastAPI가 백그라운드에서
              분석을 완료하는 방식입니다. 대용량 문서는 Gemini Embedding 무료
              티어 처리량 제한으로 실패할 수 있어, 페이지가 많은 문서는 분할해서
              올리는 편이 안전합니다.
            </p>
          </div>
          <input accept="application/pdf" onChange={handleFileChange} type="file" />
        </label>

        <div className="button-row">
          <button className="button" disabled={isPending} type="submit">
            {isPending ? "업로드 중..." : "문서 등록하기"}
          </button>
        </div>
      </form>

      {status ? <p className="status-text success">{status}</p> : null}
      {error ? <p className="status-text error">{error}</p> : null}
    </div>
  );
}
