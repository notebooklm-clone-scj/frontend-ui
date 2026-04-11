import { notFound } from "next/navigation";

import { NotebookStudio } from "@/components/workspace/notebook-studio";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import {
  fetchNotebookChatHistoryForCurrentUser,
  fetchNotebookDocumentsForCurrentUser,
  fetchNotebooksForCurrentUser,
} from "@/lib/api/core-api";

type NotebookPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NotebookPage({ params }: NotebookPageProps) {
  const { id } = await params;
  const notebookId = Number(id);
  const notebooks = await fetchNotebooksForCurrentUser();
  const currentNotebook = notebooks.find((notebook) => notebook.id === notebookId);

  if (!currentNotebook) {
    notFound();
  }

  const [documents, chatHistory] = await Promise.all([
    fetchNotebookDocumentsForCurrentUser(currentNotebook.id),
    fetchNotebookChatHistoryForCurrentUser(currentNotebook.id),
  ]);

  return (
    <WorkspaceShell
      notebooks={notebooks}
      activeNotebookId={currentNotebook.id}
      headerContent={
        <div className="topbar-copy">
          <h1>{currentNotebook.title}</h1>
          <div className="topbar-meta">
            <span className="pill">문서 {documents.length}건</span>
            <span className="pill">
              요약 완료 {documents.filter((document) => document.summary).length}건
            </span>
          </div>
        </div>
      }
    >
      <NotebookStudio
        initialChatHistory={chatHistory}
        initialDocuments={documents}
        notebook={currentNotebook}
      />
    </WorkspaceShell>
  );
}
