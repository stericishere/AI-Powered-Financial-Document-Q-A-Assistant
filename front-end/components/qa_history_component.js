'use client';

import React, { useState } from 'react';
import { MessageSquare, Clock, FileText, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { QAItem } from '../types';

interface QAHistoryProps {
  history: QAItem[];
}

interface QAItemProps {
  item: QAItem;
  isExpanded: boolean;
  onToggle: () => void;
}

const QAItemComponent: React.FC<QAItemProps> = ({ item, isExpanded, onToggle }) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 mb-1">
              {item.question}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(item.timestamp)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-32">{item.documentName}</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${getConfidenceColor(item.confidence)}`}>
                <TrendingUp className="w-3 h-3" />
                <span>{Math.round(item.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Answer:</h4>
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {item.answer}
            </div>
          </div>

          {item.sources && item.sources.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Sources:</h4>
              <div className="space-y-2">
                {item.sources.map((source, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-gray-700">
                      {source}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const QAHistory: React.FC<QAHistoryProps> = ({ history }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No questions asked yet</p>
        <p className="text-sm mt-1">Start by asking a question about your document</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {history.map((item) => (
        <QAItemComponent
          key={item.id}
          item={item}
          isExpanded={expandedItems.has(item.id)}
          onToggle={() => toggleExpanded(item.id)}
        />
      ))}
    </div>
  );
};