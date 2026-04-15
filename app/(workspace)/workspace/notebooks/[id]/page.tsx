import { notFound } from "next/navigation";

import { NotebookManageActions } from "@/components/workspace/notebook-manage-actions";
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
      compactTopbar
      headerContent={
        <div className="topbar-copy">
          <div className="topbar-title-row">
            <h1>{currentNotebook.title}</h1>
            <NotebookManageActions
              notebookId={currentNotebook.id}
              title={currentNotebook.title}
            />
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
