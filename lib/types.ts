export type Session = {
  token: string;
  userId: number;
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
};

export type DocumentItem = {
  id: number;
  filename: string;
  summary: string | null;
  totalPages: number;
  createdAt: string;
};

export type DocumentUploadResponse = {
  documentId: number;
};

export type ChatHistoryReference = {
  pageNumber: number;
  content: string;
};

export type ChatHistoryItem = {
  role: string;
  message: string;
  createdAt: string;
  references?: ChatHistoryReference[];
};

export type ReferenceChunk = {
  page_number: number;
  content: string;
};

export type NotebookChatResponse = {
  answer: string;
  reference_chunks: ReferenceChunk[];
};
