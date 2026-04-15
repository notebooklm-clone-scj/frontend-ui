"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function CreateNotebookForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("노트북 제목을 입력해 주세요.");
      return;
    }

    setIsPending(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/notebooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        notebook?: {
          id: number;
          message: string;
        };
      };

      if (!response.ok || !result.ok || !result.notebook) {
        throw new Error(result.message ?? "노트북 생성에 실패했습니다.");
      }

      setStatus(result.notebook.message);
      setTitle("");
      router.push(`/workspace/notebooks/${result.notebook.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "노트북 생성 중 오류가 발생했습니다.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <div>
        <h3 className="panel-title">Create Notebook</h3>
        <p className="section-caption">
          제목만 입력하면 Spring API로 생성 요청을 보냅니다. 계정당 최대 2개까지
          만들 수 있습니다.
        </p>
      </div>
      <input
        onChange={(event) => setTitle(event.target.value)}
        placeholder="예: 2026 AI 리서치 노트"
        value={title}
      />
      <button className="button" disabled={isPending} type="submit">
        {isPending ? "생성 중..." : "새 노트북 만들기"}
      </button>
      {status ? <p className="status-text success">{status}</p> : null}
      {error ? <p className="status-text error">{error}</p> : null}
    </form>
  );
}
