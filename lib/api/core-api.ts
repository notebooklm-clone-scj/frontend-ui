import { redirect } from "next/navigation";

import {
  requireAdminSession,
  requireSession,
} from "@/lib/auth/session";
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

class AuthenticationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

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
    const errorMessage = await parseErrorMessage(response);

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError(errorMessage, response.status);
    }

    throw new Error(errorMessage);
  }

  return response;
}

async function redirectToLoginOnAuthError(error: unknown): Promise<never> {
  if (error instanceof AuthenticationError) {
    redirect("/api/auth/logout?redirectTo=/login");
  }

  throw error;
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

export async function fetchNotebooks(token?: string) {
  const response = await coreApiFetch("/api/v1/notebooks", {
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
      title,
    }),
  });

  const message = await response.text();

  return {
    id: parseNotebookIdFromMessage(message),
    message,
  } satisfies NotebookCreateResponse;
}

export async function updateNotebookTitle(notebookId: number, title: string) {
  const session = await requireSession();

  const response = await coreApiFetch(`/api/v1/notebooks/${notebookId}`, {
    method: "PATCH",
    token: session.token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  return response.text();
}

export async function deleteNotebook(notebookId: number) {
  const session = await requireSession();

  const response = await coreApiFetch(`/api/v1/notebooks/${notebookId}`, {
    method: "DELETE",
    token: session.token,
  });

  return response.text();
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
  try {
    const session = await requireSession();

    return await fetchNotebooks(session.token);
  } catch (error) {
    return redirectToLoginOnAuthError(error);
  }
}

export async function fetchNotebookDocumentsForCurrentUser(notebookId: number) {
  try {
    const session = await requireSession();

    return await fetchDocuments(notebookId, session.token);
  } catch (error) {
    return redirectToLoginOnAuthError(error);
  }
}

export async function fetchNotebookChatHistoryForCurrentUser(notebookId: number) {
  try {
    const session = await requireSession();

    return await fetchChatHistory(notebookId, session.token);
  } catch (error) {
    return redirectToLoginOnAuthError(error);
  }
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

export async function deleteDocument(notebookId: number, documentId: number) {
  const session = await requireSession();

  const response = await coreApiFetch(
    `/api/v1/notebooks/${notebookId}/documents/${documentId}`,
    {
      method: "DELETE",
      token: session.token,
    },
  );

  return response.text();
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
  try {
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
  } catch (error) {
    return redirectToLoginOnAuthError(error);
  }
}
