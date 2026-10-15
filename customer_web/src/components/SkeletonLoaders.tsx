import React from 'react';

export const TopProgressBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  if (!isLoading) return null;
  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden bg-brand-100">
      <div className="h-full bg-gradient-to-r from-brand-600 via-amber-500 to-brand-500 animate-progressBar"></div>
    </div>
  );
};

export const SkeletonRestaurantCard: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs flex flex-col">
      {/* Cover image placeholder */}
      <div className="h-48 w-full shimmer-gradient relative">
        <div className="absolute top-3 left-3 h-6 w-28 rounded-full bg-stone-300/60"></div>
        <div className="absolute top-3 right-3 h-6 w-14 rounded-full bg-stone-300/60"></div>
        <div className="absolute bottom-3 left-3 right-3 space-y-2">
          <div className="h-5 w-44 rounded bg-stone-300/80"></div>
          <div className="h-3 w-60 rounded bg-stone-300/60"></div>
        </div>
      </div>

      {/* Details placeholder */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="h-3.5 w-4/5 rounded shimmer-gradient"></div>
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-md shimmer-gradient"></div>
            <div className="h-5 w-24 rounded-md shimmer-gradient"></div>
            <div className="h-5 w-16 rounded-md shimmer-gradient"></div>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="h-4 w-20 rounded shimmer-gradient"></div>
          <div className="h-4 w-24 rounded shimmer-gradient"></div>
          <div className="h-4 w-12 rounded shimmer-gradient"></div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonRestaurantGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonRestaurantCard key={idx} />
      ))}
    </div>
  );
};

export const SkeletonMenuItem: React.FC = () => {
  return (
    <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shimmer-gradient"></div>
          <div className="h-4 w-36 rounded shimmer-gradient"></div>
          <div className="h-4 w-12 rounded shimmer-gradient"></div>
        </div>
        <div className="h-4 w-20 rounded shimmer-gradient"></div>
        <div className="h-3 w-5/6 rounded shimmer-gradient"></div>
        <div className="h-3 w-2/3 rounded shimmer-gradient"></div>
      </div>
      <div className="shrink-0 flex flex-col items-center">
        <div className="h-8 w-20 rounded-xl shimmer-gradient"></div>
      </div>
    </div>
  );
};

export const SkeletonMenuGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonMenuItem key={idx} />
      ))}
    </div>
  );
};

export const SkeletonHero: React.FC = () => {
  return (
    <div className="rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6 p-10 sm:p-16 shimmer-dark text-white space-y-6 text-center">
      <div className="h-6 w-64 rounded-full bg-white/20 mx-auto"></div>
      <div className="h-12 w-3/4 max-w-xl rounded-2xl bg-white/20 mx-auto"></div>
      <div className="h-4 w-1/2 max-w-md rounded bg-white/10 mx-auto"></div>
      <div className="flex justify-center gap-3 pt-2">
        <div className="h-12 w-44 rounded-2xl bg-white/20"></div>
        <div className="h-12 w-40 rounded-2xl bg-white/10"></div>
      </div>
      <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/10"></div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonOrderCard: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 rounded shimmer-gradient"></div>
          <div className="h-5 w-24 rounded-full shimmer-gradient"></div>
          <div className="h-3 w-36 rounded shimmer-gradient"></div>
        </div>
        <div className="h-5 w-48 rounded shimmer-gradient"></div>
        <div className="h-3.5 w-80 rounded shimmer-gradient"></div>
        <div className="h-4 w-40 rounded shimmer-gradient"></div>
      </div>
      <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
        <div className="h-9 w-28 rounded-xl shimmer-gradient"></div>
        <div className="h-9 w-24 rounded-xl shimmer-gradient"></div>
      </div>
    </div>
  );
};

export const SkeletonOrderTracking: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="h-4 w-32 rounded shimmer-gradient"></div>
      <div className="h-14 rounded-2xl shimmer-gradient"></div>
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-6">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded shimmer-gradient"></div>
            <div className="h-7 w-56 rounded shimmer-gradient"></div>
            <div className="h-3 w-40 rounded shimmer-gradient"></div>
          </div>
          <div className="h-8 w-24 rounded-full shimmer-gradient"></div>
        </div>
        <div className="pt-6 border-t border-stone-100">
          <div className="h-4 w-44 rounded shimmer-gradient mb-6"></div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 rounded-full shimmer-gradient"></div>
                <div className="h-3 w-16 rounded shimmer-gradient"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 rounded-3xl bg-white border border-stone-200 p-6 space-y-3">
          <div className="h-5 w-32 rounded shimmer-gradient"></div>
          <div className="h-4 w-full rounded shimmer-gradient"></div>
          <div className="h-4 w-full rounded shimmer-gradient"></div>
          <div className="h-4 w-2/3 rounded shimmer-gradient"></div>
        </div>
        <div className="h-64 rounded-3xl bg-white border border-stone-200 p-6 space-y-3">
          <div className="h-5 w-32 rounded shimmer-gradient"></div>
          <div className="h-16 rounded-xl shimmer-gradient"></div>
          <div className="h-10 rounded-xl shimmer-gradient"></div>
        </div>
      </div>
    </div>
  );
};
