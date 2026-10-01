import React from 'react';

export const TopProgressBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  if (!isLoading) return null;
  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden bg-slate-100">
      <div className="h-full bg-gradient-to-r from-brand-600 via-amber-500 to-brand-500 animate-progressBar"></div>
    </div>
  );
};

export const SkeletonMetrics: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
          </div>
          <div className="h-7 w-20 bg-slate-300 rounded"></div>
          <div className="h-3 w-32 bg-slate-150 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-50 border-b border-slate-200 px-4 flex items-center gap-4">
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
        <div className="h-4 w-20 bg-slate-200 rounded"></div>
        <div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div>
      </div>
      <div className="divide-y divide-slate-100 p-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-2 w-1/4">
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
            </div>
            <div className="h-4 w-1/5 bg-slate-200 rounded"></div>
            <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
            <div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonCards: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="h-40 w-full bg-slate-200"></div>
            <div className="p-5 space-y-3">
              <div className="space-y-1.5">
                <div className="h-5 w-3/5 bg-slate-200 rounded"></div>
                <div className="h-3 w-4/5 bg-slate-100 rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-slate-100 rounded"></div>
                <div className="h-4 w-16 bg-slate-100 rounded"></div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100">
                <div className="h-6 bg-slate-100 rounded"></div>
                <div className="h-6 bg-slate-100 rounded"></div>
                <div className="h-6 bg-slate-100 rounded"></div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionText, onAction }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-100">
        {icon}
      </div>
      <h3 className="font-bold text-lg text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
