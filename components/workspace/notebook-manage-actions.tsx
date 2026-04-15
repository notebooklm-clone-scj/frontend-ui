"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type NotebookManageActionsProps = {
  notebookId: number;
  title: string;
};

export function NotebookManageActions({
  notebookId,
  title,
}: NotebookManageActionsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftTitle(title);
    setError(null);

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isPending, title]);

  async function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = draftTitle.trim();

    if (!nextTitle || nextTitle === title) {
      setIsOpen(false);
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/notebooks/${notebookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: nextTitle }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "노트북 이름 변경에 실패했습니다.");
      }

      setIsOpen(false);
      window.location.reload();
    } catch (renameError) {
      setError(
        renameError instanceof Error
          ? renameError.message
          : "노트북 이름 변경 중 오류가 발생했습니다.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button
        aria-label="노트북 이름 변경"
        className="title-icon-button"
        disabled={isPending}
        onClick={() => setIsOpen(true)}
        type="button"
        title="노트북 이름 변경"
      >
        {isPending ? "…" : "✎"}
      </button>

      {isOpen ? (
        <div
          aria-hidden={isPending}
          className="rename-modal-overlay"
          onClick={() => {
            if (!isPending) {
              setIsOpen(false);
            }
          }}
        >
          <div
            aria-labelledby="rename-notebook-title"
            aria-modal="true"
            className="rename-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="rename-modal-copy">
              <p className="rename-modal-eyebrow">Notebook Rename</p>
              <h2 id="rename-notebook-title">노트북 이름 변경</h2>
              <p className="helper-note">
                지금 노트북의 제목을 더 알아보기 쉬운 이름으로 바꿔 둘 수 있습니다.
              </p>
            </div>

            <form className="rename-modal-form" onSubmit={handleRenameSubmit}>
              <label className="rename-modal-field">
                <span>새 제목</span>
                <input
                  maxLength={100}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder="예: 국어 소설 해석 노트"
                  ref={inputRef}
                  value={draftTitle}
                />
              </label>

              {error ? <p className="status-text error">{error}</p> : null}

              <div className="rename-modal-actions">
                <button
                  className="button button-ghost"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="button"
                  disabled={isPending || !draftTitle.trim() || draftTitle.trim() === title}
                  type="submit"
                >
                  {isPending ? "변경 중..." : "이름 변경"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
