"use client";

import dynamic from 'next/dynamic';

const QnaClient = dynamic(() => import('@/components/QnaClient'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-slate-900 flex items-center justify-center"><p className="text-white">Loading...</p></div>,
});

export default function Home() {
  return <QnaClient />;
}
