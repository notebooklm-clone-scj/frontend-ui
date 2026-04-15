"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import type { Notebook } from "@/lib/types";

type NotebookSidebarItemProps = {
  notebook: Notebook;
  isActive: boolean;
};

export function NotebookSidebarItem({
  notebook,
  isActive,
}: NotebookSidebarItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `"${notebook.title}" 노트북을 삭제할까요? 문서와 채팅도 함께 삭제됩니다.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/notebooks/${notebook.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "노트북 삭제에 실패했습니다.");
      }

      if (pathname?.includes(`/workspace/notebooks/${notebook.id}`)) {
        router.push("/workspace");
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "노트북 삭제 중 오류가 발생했습니다.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <div className="sidebar-item-wrap">
      <div className={`sidebar-link ${isActive ? "active" : ""}`.trim()}>
        <div className="sidebar-link-head">
          <Link className="sidebar-link-content" href={`/workspace/notebooks/${notebook.id}`}>
            <strong>{notebook.title}</strong>
            <span>노트북 열기</span>
          </Link>
          <button
            aria-label={`${notebook.title} 삭제`}
            className="list-icon-button danger"
            disabled={isDeleting}
            onClick={handleDelete}
            type="button"
          >
            {isDeleting ? "…" : "×"}
          </button>
        </div>
      </div>
      {error ? <p className="status-text error">{error}</p> : null}
    </div>
  );
}
