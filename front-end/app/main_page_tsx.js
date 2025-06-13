'use client';

import React, { useState, useEffect } from 'react';
import { FileUploader } from '../components/FileUploader';
import { QueryInterface } from '../components/QueryInterface';
import { DocumentList } from '../components/DocumentList';
import { QAHistory } from '../components/QAHistory';
import { Header } from '../components/Header';
import { Toaster } from 'react-hot-toast';
import { DocumentInfo, QAItem } from '../types';
import { api } from '../utils/api';

export default function Home() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [qaHistory, setQAHistory] = useState<QAItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
      
      // Auto-select the first ready document if none selected
      if (!selectedDocument && docs.length > 0) {
        const readyDoc = docs.find(doc => doc.status === 'ready');
        if (readyDoc) {
          setSelectedDocument(readyDoc.id);
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const result = await api.uploadDocument(file);
      await loadDocuments(); // Refresh document list
      
      // Poll for processing completion
      pollDocumentStatus(result.document_id);
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const pollDocumentStatus = async (documentId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const docInfo = await api.getDocumentInfo(documentId);
        
        if (docInfo.status === 'ready') {
          clearInterval(pollInterval);
          await loadDocuments();
          setSelectedDocument(documentId);
        } else if (docInfo.status === 'error') {
          clearInterval(pollInterval);
          await loadDocuments();
        }
      } catch (error) {
        clearInterval(pollInterval);
        console.error('Error polling document status:', error);
      }
    }, 2000);

    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const handleQuery = async (question: string) => {
    if (!selectedDocument) {
      throw new Error('Please select a document first');
    }

    setIsLoading(true);
    try {
      const response = await api.queryDocument(question, selectedDocument);
      
      const newQAItem: QAItem = {
        id: Date.now().toString(),
        question,
        answer: response.answer,
        timestamp: new Date(),
        documentId: selectedDocument,
        documentName: documents.find(d => d.id === selectedDocument)?.filename || '',
        confidence: response.confidence,
        sources: response.sources
      };

      setQAHistory(prev => [newQAItem, ...prev]);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await api.deleteDocument(documentId);
      await loadDocuments();
      
      // Clear selection if deleted document was selected
      if (selectedDocument === documentId) {
        setSelectedDocument(null);
        setQAHistory([]); // Clear history for deleted document
      }
      
      // Remove QA items for deleted document
      setQAHistory(prev => prev.filter(item => item.documentId !== documentId));
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  };

  const selectedDocumentInfo = documents.find(doc => doc.id === selectedDocument);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Upload and Documents */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Upload Document
              </h2>
              <FileUploader onUpload={handleFileUpload} isLoading={isLoading} />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Documents
              </h2>
              <DocumentList
                documents={documents}
                selectedDocument={selectedDocument}
                onSelectDocument={setSelectedDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            </div>
          </div>

          {/* Right Column - Query Interface and History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Ask Questions About Your Document
                </h2>
                {selectedDocumentInfo && (
                  <p className="text-sm text-gray-600 mt-1">
                    Currently analyzing: <span className="font-medium">{selectedDocumentInfo.filename}</span>
                  </p>
                )}
              </div>
              
              <QueryInterface
                onQuery={handleQuery}
                isLoading={isLoading}
                disabled={!selectedDocument || selectedDocumentInfo?.status !== 'ready'}
                placeholder={
                  !selectedDocument 
                    ? "Please upload and select a document first..."
                    : selectedDocumentInfo?.status !== 'ready'
                    ? "Please wait for document processing to complete..."
                    : "Ask questions about your financial document..."
                }
              />
            </div>

            {qaHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Q&A History
                </h2>
                <QAHistory history={qaHistory} />
              </div>
            )}
          </div>
        </div>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}