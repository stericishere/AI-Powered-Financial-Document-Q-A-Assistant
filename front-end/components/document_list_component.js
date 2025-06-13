'use client';

import React from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Trash2, Calendar } from 'lucide-react';
import { DocumentInfo } from '../types';
import toast from 'react-hot-toast';

interface DocumentListProps {
  documents: DocumentInfo[];
  selectedDocument: string | null;
  onSelectDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => Promise<void>;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument
}) => {
  const handleDelete = async (documentId: string, filename: string) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        await onDeleteDocument(documentId);
        toast.success('Document deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete document');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No documents uploaded yet</p>
        <p className="text-sm mt-1">Upload a PDF to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className={`
            border rounded-lg p-4 cursor-pointer transition-all duration-200
            ${selectedDocument === doc.id 
              ? 'border-blue-500 bg-blue-50 shadow-md' 
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }
            ${doc.status === 'ready' ? 'hover:bg-gray-50' : ''}
          `}
          onClick={() => doc.status === 'ready' && onSelectDocument(doc.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <h3 className="font-medium text-gray-900 truncate">
                  {doc.filename}
                </h3>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(doc.status)}
                  <span>{getStatusText(doc.status)}</span>
                </div>
                
                {doc.pageCount && (
                  <div className="flex items-center space-x-1">
                    <span>{doc.pageCount} pages</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(doc.uploadTime)}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(doc.id, doc.filename);
              }}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {selectedDocument === doc.id && doc.status === 'ready' && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <CheckCircle className="w-4 h-4" />
                <span>Currently selected for analysis</span>
              </div>
            </div>
          )}
          
          {doc.status === 'processing' && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-yellow-600">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Processing document... This may take a few moments</span>
              </div>
            </div>
          )}
          
          {doc.status === 'error' && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>Processing failed. Please try uploading again.</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};