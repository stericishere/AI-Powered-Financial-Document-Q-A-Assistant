export interface DocumentInfo {
  id: string;
  filename: string;
  uploadTime: Date;
  status: 'processing' | 'ready' | 'error';
  pageCount?: number;
}

export interface QAItem {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  documentId: string;
  documentName: string;
  confidence: number;
  sources: string[];
}

export interface QueryResponse {
  answer: string;
  confidence: number;
  sources: string[];
  documentContext?: string;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  status: string;
  message: string;
}