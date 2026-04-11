import Link from "next/link";

import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { fetchNotebooksForCurrentUser } from "@/lib/api/core-api";

export default async function WorkspaceHomePage() {
  const notebooks = await fetchNotebooksForCurrentUser();

  return (
    <WorkspaceShell
      headerContent={
        <div className="topbar-copy">
          <h1>Notebook Launcher</h1>
          <p>새 노트북을 만들거나 기존 노트북을 열어 바로 작업을 시작합니다.</p>
        </div>
      }
      notebooks={notebooks}
    >
      <section className="content-grid">
        <article className="panel panel-hero">
          <span className="eyebrow">Start Here</span>
          <p>
            왼쪽 사이드바에서 새 노트북을 만들거나, 오른쪽 목록에서 기존 노트북을
            열어 바로 문서 업로드와 채팅 작업으로 들어가면 됩니다.
          </p>
          <div className="insight-list">
            <article className="insight-card">
              <strong>1. Create Notebook</strong>
              <p>사이드바의 생성 폼에서 제목만 입력하면 곧바로 노트북이 만들어집니다.</p>
            </article>
            <article className="insight-card">
              <strong>2. Open Notebook</strong>
              <p>기존 노트북을 선택하면 문서 업로드, 요약 확인, 노트북 채팅으로 이동합니다.</p>
            </article>
            <article className="insight-card">
              <strong>3. Continue Research</strong>
              <p>문서는 오른쪽에서 관리하고, 질문과 답변은 중앙 채팅에서 이어갑니다.</p>
            </article>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Recent Notebooks</span>
              <h2>바로 이어서 작업할 노트북</h2>
            </div>
          </div>

          {notebooks.length === 0 ? (
            <div className="empty-card">
              <h3>아직 노트북이 없어요.</h3>
              <p>
                왼쪽 사이드바의 생성 폼으로 첫 노트북을 만들어 보세요. 생성 직후
                해당 노트북 작업 화면으로 이동합니다.
              </p>
            </div>
          ) : (
            <div className="notebook-card-list">
              {notebooks.map((notebook) => (
                <Link
                  className="notebook-card"
                  href={`/workspace/notebooks/${notebook.id}`}
                  key={notebook.id}
                >
                  <strong>{notebook.title}</strong>
                  <p>문서 업로드와 채팅 작업 이어서 하기</p>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </WorkspaceShell>
  );
}
