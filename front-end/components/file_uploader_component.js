'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploaderProps {
  onUpload: (file: File) => Promise<any>;
  isLoading?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, isLoading = false }) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      const result = await onUpload(file);
      toast.success(`${file.name} uploaded successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200
        ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
        ${isDragReject ? 'border-red-400 bg-red-50' : ''}
        ${!isDragActive && !isDragReject ? 'border-gray-300 hover:border-gray-400' : ''}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-4">
        {isLoading ? (
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        ) : (
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
            {isDragActive ? (
              <FileText className="w-8 h-8 text-blue-600" />
            ) : (
              <Upload className="w-8 h-8 text-blue-600" />
            )}
          </div>
        )}
        
        <div>
          <p className="text-lg font-medium text-gray-700">
            {isLoading ? 'Uploading...' : 
             isDragActive ? 'Drop your PDF here' : 
             'Upload Financial Document'}
          </p>
          
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-2">
              {isDragReject ? 
                'Only PDF files are supported' : 
                'Drag & drop a PDF file here, or click to select'
              }
            </p>
          )}
        </div>
        
        {!isLoading && (
          <div className="text-xs text-gray-400">
            Supported: PDF files up to 10MB
          </div>
        )}
      </div>
    </div>
  );
};