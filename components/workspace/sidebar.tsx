import Link from "next/link";

import { CreateNotebookForm } from "@/components/workspace/create-notebook-form";
import type { Notebook } from "@/lib/types";

type SidebarProps = {
  notebooks: Notebook[];
  activeNotebookId?: number;
};

export function Sidebar({ notebooks, activeNotebookId }: SidebarProps) {
  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h3>Workspace</h3>
        <div className="sidebar-list">
          <Link
            className={`sidebar-link ${activeNotebookId ? "" : "active"}`.trim()}
            href="/workspace"
          >
            <strong>노트북 시작 화면</strong>
            <span>새 노트북 생성과 기존 노트북 진입</span>
          </Link>
        </div>
      </section>

      <section className="sidebar-section">
        <h3>Notebooks</h3>
        <div className="sidebar-list">
          {notebooks.length === 0 ? (
            <p className="empty-subtle">생성된 노트북이 아직 없습니다.</p>
          ) : (
            notebooks.map((notebook) => (
              <Link
                className={`sidebar-link ${
                  activeNotebookId === notebook.id ? "active" : ""
                }`.trim()}
                href={`/workspace/notebooks/${notebook.id}`}
                key={notebook.id}
              >
                <strong>{notebook.title}</strong>
                <span>노트북 열기</span>
              </Link>
            ))
          )}
        </div>
      </section>
      
      <CreateNotebookForm />

    </aside>
  );
}
