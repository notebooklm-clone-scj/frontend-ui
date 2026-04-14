import Link from "next/link";

import { LogoutButton } from "@/components/workspace/logout-button";
import { fetchAdminAiCallLogs } from "@/lib/api/core-api";
import type { AiRequestType } from "@/lib/types";

const REQUEST_TYPES: AiRequestType[] = ["PDF_SUMMARY", "CHAT", "CHAT_SUMMARY"];

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSingleParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseOptionalNumber(value: string | undefined) {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalBoolean(value: string | undefined) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildPageHref(
  params: {
    success?: string;
    requestType?: string;
    notebookId?: string;
    documentId?: string;
    size?: string;
  },
  page: number,
) {
  const nextParams = new URLSearchParams();

  if (params.success) {
    nextParams.set("success", params.success);
  }

  if (params.requestType) {
    nextParams.set("requestType", params.requestType);
  }

  if (params.notebookId) {
    nextParams.set("notebookId", params.notebookId);
  }

  if (params.documentId) {
    nextParams.set("documentId", params.documentId);
  }

  if (params.size) {
    nextParams.set("size", params.size);
  }

  nextParams.set("page", String(page));

  return `/admin?${nextParams.toString()}`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const success = readSingleParam(resolvedSearchParams.success);
  const requestType = readSingleParam(resolvedSearchParams.requestType);
  const notebookId = readSingleParam(resolvedSearchParams.notebookId);
  const documentId = readSingleParam(resolvedSearchParams.documentId);
  const sizeParam = readSingleParam(resolvedSearchParams.size);
  const pageParam = readSingleParam(resolvedSearchParams.page);

  const currentPage = Math.max(parseOptionalNumber(pageParam) ?? 0, 0);
  const pageSize = Math.min(Math.max(parseOptionalNumber(sizeParam) ?? 20, 10), 50);

  const logPage = await fetchAdminAiCallLogs({
    success: parseOptionalBoolean(success),
    requestType: REQUEST_TYPES.includes(requestType as AiRequestType)
      ? (requestType as AiRequestType)
      : undefined,
    notebookId: parseOptionalNumber(notebookId),
    documentId: parseOptionalNumber(documentId),
    page: currentPage,
    size: pageSize,
  });

  const failureCount = logPage.content.filter((item) => !item.success).length;
  const averageLatency =
    logPage.content.length > 0
      ? Math.round(
          logPage.content.reduce((total, item) => total + (item.latencyMs ?? 0), 0) /
            logPage.content.length,
        )
      : 0;

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="topbar-copy">
          <span className="eyebrow">Admin Console</span>
          <h1>AI 호출 운영 대시보드</h1>
          <p>관리자 계정은 워크스페이스 대신 호출 로그와 실패 흐름을 먼저 확인합니다.</p>
        </div>
        <div className="topbar-actions">
          <span className="eyebrow">Role Admin</span>
          <LogoutButton />
        </div>
      </header>

      <section className="admin-layout">
        <aside className="panel admin-filter-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Filters</span>
              <h2>로그 탐색</h2>
            </div>
          </div>

          <form className="admin-filter-grid" method="GET">
            <label className="field-label">
              성공 여부
              <select defaultValue={success ?? ""} name="success">
                <option value="">전체</option>
                <option value="true">성공만</option>
                <option value="false">실패만</option>
              </select>
            </label>

            <label className="field-label">
              요청 종류
              <select defaultValue={requestType ?? ""} name="requestType">
                <option value="">전체</option>
                {REQUEST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              notebookId
              <input defaultValue={notebookId ?? ""} name="notebookId" placeholder="예: 12" />
            </label>

            <label className="field-label">
              documentId
              <input defaultValue={documentId ?? ""} name="documentId" placeholder="예: 34" />
            </label>

            <label className="field-label">
              페이지 크기
              <select defaultValue={String(pageSize)} name="size">
                {[10, 20, 30, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}개
                  </option>
                ))}
              </select>
            </label>

            <div className="button-row">
              <button className="button" type="submit">
                적용
              </button>
              <Link className="button-secondary" href="/admin">
                초기화
              </Link>
            </div>
          </form>

          <div className="empty-subtle">
            요청 종류, 성공 여부, notebookId, documentId 기준으로 운영 이력을 바로 좁혀볼 수 있습니다.
          </div>
        </aside>

        <section className="admin-content">
          <div className="admin-summary-grid">
            <article className="stat-card">
              <span className="stat-label">Current Page Logs</span>
              <strong>{logPage.content.length}건</strong>
              <p className="section-caption">현재 조건에서 불러온 로그 수</p>
            </article>
            <article className="stat-card">
              <span className="stat-label">Failures</span>
              <strong>{failureCount}건</strong>
              <p className="section-caption">현재 페이지 기준 실패 응답</p>
            </article>
            <article className="stat-card">
              <span className="stat-label">Average Latency</span>
              <strong>{averageLatency}ms</strong>
              <p className="section-caption">현재 페이지 기준 평균 응답 시간</p>
            </article>
            <article className="stat-card">
              <span className="stat-label">Total Elements</span>
              <strong>{logPage.totalElements}건</strong>
              <p className="section-caption">필터 조건 전체 누적 로그 수</p>
            </article>
          </div>

          <article className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">AI Call Logs</span>
                <h2>운영 로그 목록</h2>
              </div>
              <p className="section-caption">
                page {logPage.page + 1} / {Math.max(logPage.totalPages, 1)}
              </p>
            </div>

            {logPage.content.length === 0 ? (
              <div className="empty-card">
                <h3>조건에 맞는 로그가 없습니다.</h3>
                <p>필터를 초기화하거나, 다른 notebookId/documentId 조합으로 다시 확인해 보세요.</p>
              </div>
            ) : (
              <div className="admin-log-list">
                {logPage.content.map((item) => (
                  <article className="admin-log-card" key={item.id}>
                    <div className="admin-log-header">
                      <div>
                        <div className="admin-log-title-row">
                          <strong>{item.requestType}</strong>
                          <span
                            className={`admin-status ${item.success ? "success" : "failure"}`}
                          >
                            {item.success ? "SUCCESS" : "FAILURE"}
                          </span>
                        </div>
                        <p className="section-caption">{formatDateTime(item.createdAt)}</p>
                      </div>
                      <div className="admin-log-latency">{item.latencyMs ?? 0}ms</div>
                    </div>

                    <div className="admin-log-meta">
                      <span>requestId {item.requestId}</span>
                      <span>notebook {item.notebookId ?? "-"}</span>
                      <span>document {item.documentId ?? "-"}</span>
                      <span>references {item.referenceCount ?? 0}</span>
                    </div>

                    {item.errorCode || item.errorMessage ? (
                      <div className="admin-log-error">
                        <strong>{item.errorCode ?? "AI_ERROR"}</strong>
                        <p>{item.errorMessage ?? "에러 메시지가 비어 있습니다."}</p>
                      </div>
                    ) : (
                      <p className="empty-subtle">
                        정상 응답으로 처리되었습니다. 추가 에러 메시지는 기록되지 않았습니다.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            <div className="admin-pagination">
              {logPage.page > 0 ? (
                <Link
                  className="button-secondary"
                  href={buildPageHref(
                    {
                      success,
                      requestType,
                      notebookId,
                      documentId,
                      size: String(pageSize),
                    },
                    logPage.page - 1,
                  )}
                >
                  이전 페이지
                </Link>
              ) : (
                <span className="button-secondary button-disabled">이전 페이지</span>
              )}

              {logPage.hasNext ? (
                <Link
                  className="button"
                  href={buildPageHref(
                    {
                      success,
                      requestType,
                      notebookId,
                      documentId,
                      size: String(pageSize),
                    },
                    logPage.page + 1,
                  )}
                >
                  다음 페이지
                </Link>
              ) : (
                <span className="button button-disabled">다음 페이지</span>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
