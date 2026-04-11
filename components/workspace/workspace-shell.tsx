import type { ReactNode } from "react";

import { LogoutButton } from "@/components/workspace/logout-button";
import { Sidebar } from "@/components/workspace/sidebar";
import type { Notebook } from "@/lib/types";

type WorkspaceShellProps = {
  notebooks: Notebook[];
  activeNotebookId?: number;
  children: ReactNode;
  headerContent?: ReactNode;
};

export function WorkspaceShell({
  notebooks,
  activeNotebookId,
  children,
  headerContent,
}: WorkspaceShellProps) {
  return (
    <main className="workspace-shell">
      <Sidebar activeNotebookId={activeNotebookId} notebooks={notebooks} />

      <section className="content-frame">
        <header className="topbar">
          {headerContent ?? (
            <div className="topbar-copy">
              <h1>Research Workspace</h1>
              <p>
                노트북 생성, 비동기 문서 분석, 문서 기반 채팅까지 한 화면 흐름으로
                연결되어 있습니다.
              </p>
            </div>
          )}
          <div className="topbar-actions">
            <span className="eyebrow">Frontend Only Delivery</span>
            <LogoutButton />
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
