'use client';

import React, { useState } from 'react';
import { Send, Loader2, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

interface QueryInterfaceProps {
  onQuery: (question: string) => Promise<any>;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const SAMPLE_QUESTIONS = [
  "What was the total revenue for the most recent year?",
  "What is the company's net income?",
  "Show me the current assets and liabilities",
  "What were the operating expenses?",
  "What is the debt-to-equity ratio?",
  "How much cash does the company have?",
];

export const QueryInterface: React.FC<QueryInterfaceProps> = ({
  onQuery,
  isLoading = false,
  disabled = false,
  placeholder = "Ask a question about your document..."
}) => {
  const [question, setQuestion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || disabled || isLoading) return;

    try {
      await onQuery(question.trim());
      setQuestion('');
      setShowSuggestions(false);
    } catch (error: any) {
      toast.error(error.message || 'Query failed');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Query Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              rows={3}
              className={`
                w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${disabled ? 'opacity-50' : ''}
              `}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={disabled || isLoading || !question.trim()}
            className={`
              px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
              hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center space-x-2 transition-colors duration-200
            `}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Analyzing...' : 'Ask'}</span>
          </button>
        </div>
      </form>

      {/* Suggestions Toggle */}
      {!disabled && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Lightbulb className="w-4 h-4" />
            <span>
              {showSuggestions ? 'Hide' : 'Show'} sample questions
            </span>
          </button>
        </div>
      )}

      {/* Sample Questions */}
      {showSuggestions && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Sample Questions:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SAMPLE_QUESTIONS.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left p-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-white rounded border border-transparent hover:border-blue-200 transition-colors duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};