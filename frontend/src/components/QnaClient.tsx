"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, FileText, Send, User, Bot, Loader, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QnaClient() {
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{ query: string, response: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history, isTyping]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile);
      setHistory([]);
      setQuery('');
      handleUpload(uploadedFile);
    } else {
        setUploadMessage('Only .csv files are supported.');
    }
  }, []);

  const handleUpload = async (fileToUpload: File) => {
    const formData = new FormData();
    formData.append('file', fileToUpload);

    setLoading(true);
    setUploadMessage('Uploading and processing...');
    try {
      const res = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadMessage(res.data.message);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadMessage('Error uploading file. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuery = async () => {
    if (!query.trim()) return;
    
    const currentQuery = query;
    setHistory(prev => [...prev, { query: currentQuery, response: '' }]);
    setQuery('');
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('query', currentQuery);

      const res = await axios.post('http://localhost:8000/query', formData, {
         headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const newResponse = res.data.response;
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].response = newResponse;
        return newHistory;
      });

    } catch (error) {
      console.error('Error querying:', error);
       setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].response = 'Error: Could not get a response.';
        return newHistory;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const handleRemoveFile = () => {
    setFile(null);
    setUploadMessage('');
    setHistory([]);
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans p-4">
      <motion.div 
        className="w-full max-w-4xl h-[80vh] min-h-[600px] bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <header className="p-6 border-b border-white/10 text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                Financial Document Q&A
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
                AI-powered insights for your financial statements
            </p>
        </header>

        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="dropzone"
                className="w-full h-full flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  {...getRootProps()} 
                  className={`p-12 w-full max-w-lg h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 text-center flex flex-col items-center justify-center
                    ${isDragActive ? 
                      'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' : 
                      'border-slate-600 hover:border-blue-500 hover:bg-slate-800/30'}`}
                >
                  <input {...getInputProps()} />
                  <motion.div
                    animate={{ scale: isDragActive ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <UploadCloud className={`w-16 h-16 mb-4 ${isDragActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  </motion.div>
                  <p className="text-lg font-semibold">{isDragActive ? 'Drop the file to start!' : 'Drag & drop a CSV file here'}</p>
                  <p className="text-sm text-slate-500 mt-1">or click to select a file</p>
                </div>
                 {uploadMessage && !loading && (
                    <p className="text-center text-red-400 mt-4">{uploadMessage}</p>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="chat"
                className="w-full h-full flex flex-col overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="p-4 bg-slate-800/50 rounded-xl mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-green-400" />
                        <span className="font-semibold">{file.name}</span>
                    </div>
                    <button onClick={handleRemoveFile} className="text-slate-400 hover:text-white transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                <div ref={chatContainerRef} className="flex-1 space-y-6 overflow-y-auto pr-2">
                    <AnimatePresence>
                        {history.map((item, index) => (
                            <motion.div key={index} className="flex flex-col gap-4" variants={itemVariants} initial="hidden" animate="visible" exit="hidden">
                                <div className="flex items-start gap-3 justify-end">
                                    <div className="bg-blue-600 p-3 rounded-lg rounded-br-none max-w-md shadow-md">
                                        <p>{item.query}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center border border-slate-600">
                                        <User className="w-6 h-6" />
                                    </div>
                                </div>
                                 {item.response && (
                                    <motion.div className="flex items-start gap-3" variants={itemVariants} initial="hidden" animate="visible">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center border border-slate-600">
                                            <Bot className="w-6 h-6" />
                                        </div>
                                        <div className="bg-slate-700/80 p-3 rounded-lg rounded-bl-none max-w-md shadow-md">
                                            <p className="whitespace-pre-wrap">{item.response}</p>
                                        </div>
                                    </motion.div>
                                 )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                    {isTyping && (
                         <motion.div className="flex items-start gap-3" variants={itemVariants} initial="hidden" animate="visible" exit="hidden">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center border border-slate-600">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div className="bg-slate-700/80 p-3 rounded-lg rounded-bl-none max-w-xs flex items-center gap-2 shadow-md">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
                <div className="mt-4">
                     <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !loading && handleQuery()}
                            placeholder="Ask a question..."
                            className="w-full p-4 pr-12 bg-slate-700/80 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                            disabled={loading || isTyping}
                        />
                        <button
                            onClick={handleQuery}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                            disabled={loading || isTyping || !query.trim()}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
    </motion.div>
    </div>
  );
} 