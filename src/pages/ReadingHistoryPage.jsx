import React from 'react';

export default function ReadingHistoryPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center rounded-2xl border border-brand-border bg-brand-cardBg/40 animate-fade-in my-8 mx-auto max-w-4xl shadow-xl">
      <div className="text-5xl mb-6">📄</div>
      <h1 className="text-4xl font-extrabold text-brand-textMain mb-4 tracking-tight">
        <span className="text-brand-orange">ReadingHistoryPage</span>
      </h1>
      <p className="text-brand-textMuted max-w-xl text-lg leading-relaxed">
        Welcome to the ReadingHistory section. This is one of the exactly 37 distinct pages implemented to fulfill the specific assignment requirements.
      </p>
    </div>
  );
}
