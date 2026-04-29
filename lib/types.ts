export type UserRole = "USER" | "ADMIN";

export type Session = {
  token: string;
  refreshToken?: string;
  userId: number;
  role: UserRole;
};

export type Notebook = {
  id: number;
  title: string;
  createdAt: string;
};

export type NotebookCreateResponse = {
  id: number;
  message: string;
};

export type SignupPayload = {
  email: string;
  password: string;
  nickname: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupResponse = {
  id: number;
  message: string;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  role: UserRole;
};

export type DocumentItem = {
  id: number;
  filename: string;
  summary: string | null;
  totalPages: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
};

export type DocumentUploadResponse = {
  documentId: number;
};

export type ChatHistoryReference = {
  documentId?: number | null;
  documentTitle?: string | null;
  sectionTitle?: string | null;
  pageNumber: number;
  chunkIndex?: number | null;
  pageChunkIndex?: number | null;
  content: string;
};

export type ChatHistoryItem = {
  role: string;
  message: string;
  createdAt: string;
  references?: ChatHistoryReference[];
};

export type ReferenceChunk = {
  document_id?: number | null;
  document_title?: string | null;
  section_title?: string | null;
  page_number: number;
  chunk_index?: number | null;
  page_chunk_index?: number | null;
  content: string;
};

export type NotebookChatResponse = {
  answer: string;
  reference_chunks: ReferenceChunk[];
};

export type AiRequestType = "PDF_SUMMARY" | "CHAT" | "CHAT_SUMMARY";

export type AdminAiCallLogItem = {
  id: number;
  requestId: string;
  requestType: AiRequestType;
  notebookId: number | null;
  documentId: number | null;
  success: boolean;
  latencyMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  referenceCount: number | null;
  createdAt: string;
};

export type AdminAiCallLogPage = {
  content: AdminAiCallLogItem[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
};
