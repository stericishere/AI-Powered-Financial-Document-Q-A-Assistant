import axios from 'axios';
import { DocumentInfo, QueryResponse, UploadResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.detail || 'Bad request');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    } else {
      throw new Error(error.response?.data?.detail || 'An unexpected error occurred');
    }
  }
);

export const api = {
  // Upload a document
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 1 minute timeout for uploads
    });

    return response.data;
  },

  // Get all documents
  async getDocuments(): Promise<DocumentInfo[]> {
    const response = await apiClient.get('/documents');
    return response.data.map((doc: any) => ({
      ...doc,
      uploadTime: new Date(doc.upload_time),
      pageCount: doc.page_count,
    }));
  },

  // Get specific document info
  async getDocumentInfo(documentId: string): Promise<DocumentInfo> {
    const response = await apiClient.get(`/documents/${documentId}`);
    return {
      ...response.data,
      uploadTime: new Date(response.data.upload_time),
      pageCount: response.data.page_count,
    };
  },

  // Query a document
  async queryDocument(question: string, documentId?: string): Promise<QueryResponse> {
    const payload: { question: string; document_id?: string } = { question };
    if (documentId) {
      payload.document_id = documentId;
    }

    const response = await apiClient.post('/query', payload);
    return response.data;
  },

  // Delete a document
  async deleteDocument(documentId: string): Promise<void> {
    await apiClient.delete(`/documents/${documentId}`);
  },

  // Health check
  async healthCheck(): Promise<{ message: string }> {
    const response = await apiClient.get('/');
    return response.data;
  },
};