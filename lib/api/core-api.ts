import { requireAdminSession, requireSession } from "@/lib/auth/session";
import type {
  AdminAiCallLogPage,
  AiRequestType,
  ChatHistoryItem,
  DocumentItem,
  LoginResponse,
  LoginPayload,
  Notebook,
  NotebookChatResponse,
  NotebookCreateResponse,
  SignupResponse,
  SignupPayload,
} from "@/lib/types";

const FALLBACK_CORE_API_BASE_URL = "http://localhost:8080";

function sortDocumentsByNewest(documents: DocumentItem[]) {
  return [...documents].sort((left, right) => {
    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });
}

function getCoreApiBaseUrl() {
  return (
    process.env.CORE_API_BASE_URL?.replace(/\/$/, "") ??
    FALLBACK_CORE_API_BASE_URL
  );
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function parseErrorMessage(response: Response) {
  const body = await readResponseBody(response);

  if (typeof body === "string") {
    return body || "요청 처리에 실패했습니다.";
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const candidates = ["message", "detail", "error"];

    for (const candidate of candidates) {
      const value = record[candidate];

      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return "요청 처리에 실패했습니다.";
}

export async function coreApiFetch(
  path: string,
  init?: RequestInit & { token?: string },
) {
  const headers = new Headers(init?.headers);

  if (init?.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  const response = await fetch(`${getCoreApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response;
}

export async function signupViaCoreApi(payload: SignupPayload) {
  const response = await coreApiFetch("/api/v1/users/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as SignupResponse;
}

export async function loginViaCoreApi(payload: LoginPayload) {
  const response = await coreApiFetch("/api/v1/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as LoginResponse;
}

function parseNotebookIdFromMessage(message: string) {
  const match = message.match(/(\d+)\s*$/);

  if (!match) {
    throw new Error("노트북 생성 응답에서 ID를 읽지 못했습니다.");
  }

  return Number(match[1]);
}

export async function fetchNotebooks(userId: number, token?: string) {
  const response = await coreApiFetch(`/api/v1/notebooks/user/${userId}`, {
    token,
  });

  return (await response.json()) as Notebook[];
}

export async function createNotebook(title: string) {
  const session = await requireSession();

  const response = await coreApiFetch("/api/v1/notebooks", {
    method: "POST",
    token: session.token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: session.userId,
      title,
    }),
  });

  const message = await response.text();

  return {
    id: parseNotebookIdFromMessage(message),
    message,
  } satisfies NotebookCreateResponse;
}

export async function fetchDocuments(notebookId: number, token?: string) {
  const response = await coreApiFetch(`/api/v1/notebooks/${notebookId}/documents`, {
    token,
  });

  return sortDocumentsByNewest((await response.json()) as DocumentItem[]);
}

export async function fetchChatHistory(notebookId: number, token?: string) {
  const response = await coreApiFetch(`/api/v1/notebooks/${notebookId}/chat`, {
    token,
  });

  return (await response.json()) as ChatHistoryItem[];
}

export async function fetchNotebooksForCurrentUser() {
  const session = await requireSession();

  return fetchNotebooks(session.userId, session.token);
}

export async function fetchNotebookDocumentsForCurrentUser(notebookId: number) {
  const session = await requireSession();

  return fetchDocuments(notebookId, session.token);
}

export async function fetchNotebookChatHistoryForCurrentUser(notebookId: number) {
  const session = await requireSession();

  return fetchChatHistory(notebookId, session.token);
}

export async function askNotebookQuestionForCurrentUser(
  notebookId: number,
  question: string,
) {
  const session = await requireSession();
  const response = await coreApiFetch(`/api/v1/notebooks/${notebookId}/chat`, {
    method: "POST",
    token: session.token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  return (await response.json()) as NotebookChatResponse;
}

type AdminAiCallLogFilters = {
  success?: boolean;
  requestType?: AiRequestType;
  notebookId?: number;
  documentId?: number;
  page?: number;
  size?: number;
};

export async function fetchAdminAiCallLogs(
  filters: AdminAiCallLogFilters = {},
) {
  const session = await requireAdminSession();
  const params = new URLSearchParams();

  if (typeof filters.success === "boolean") {
    params.set("success", String(filters.success));
  }

  if (filters.requestType) {
    params.set("requestType", filters.requestType);
  }

  if (typeof filters.notebookId === "number") {
    params.set("notebookId", String(filters.notebookId));
  }

  if (typeof filters.documentId === "number") {
    params.set("documentId", String(filters.documentId));
  }

  if (typeof filters.page === "number") {
    params.set("page", String(filters.page));
  }

  if (typeof filters.size === "number") {
    params.set("size", String(filters.size));
  }

  const query = params.toString();
  const path = query
    ? `/api/v1/admin/ai-call-logs?${query}`
    : "/api/v1/admin/ai-call-logs";

  const response = await coreApiFetch(path, {
    token: session.token,
  });

  return (await response.json()) as AdminAiCallLogPage;
}
