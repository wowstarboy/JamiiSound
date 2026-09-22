import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const AlbumSkeleton: React.FC = () => {
  return (
    <div id="album-skeleton" className="w-full min-h-screen text-white pb-28 bg-black animate-pulse">
      {/* Full-Screen Top Album Image Hero Banner Skeleton */}
      <div className="relative w-full h-[60vh] min-h-[400px] flex flex-col justify-end overflow-hidden bg-neutral-900">
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 p-2.5 bg-black/40 rounded-full">
          <ArrowLeft className="w-6 h-6 text-white/20" />
        </div>

        {/* Centered Cover Art Skeleton */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-[-10%]">
          <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-xl bg-neutral-800 shadow-2xl"></div>
        </div>

        {/* Hero Content Skeleton positioned at bottom */}
        <div className="relative z-10 w-full px-4 sm:px-8 pb-6 flex flex-col gap-3 mt-auto">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-5 w-16 bg-neutral-800 rounded-full"></div>
            <div className="h-5 w-24 bg-neutral-800 rounded-full"></div>
            <div className="h-4 w-12 bg-neutral-800/50 rounded-md"></div>
          </div>

          <div className="h-12 sm:h-16 w-3/4 max-w-lg bg-neutral-800 rounded-lg"></div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="h-5 w-32 bg-neutral-800 rounded-md"></div>
            <div className="h-4 w-16 bg-neutral-800/50 rounded-md"></div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="h-12 w-36 bg-neutral-800 rounded-full"></div>
            <div className="h-12 w-12 bg-neutral-800 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Tracklist Skeleton */}
      <div className="w-full px-2 sm:px-6 md:px-8 pt-4">
        {/* Header */}
        <div className="hidden sm:flex items-center px-4 py-2 border-b border-white/5">
          <div className="w-8 h-3 bg-neutral-800 rounded mr-3"></div>
          <div className="flex-1 h-3 bg-neutral-800 rounded"></div>
          <div className="w-24 h-3 bg-neutral-800 rounded"></div>
          <div className="w-16 h-3 bg-neutral-800 rounded mr-2"></div>
          <div className="w-10"></div>
        </div>

        <div className="divide-y divide-white/5 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center px-3 sm:px-4 py-3 gap-4">
              <div className="w-6 h-6 bg-neutral-800 rounded shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-800/50 rounded w-1/3"></div>
              </div>
              <div className="hidden sm:block w-16 h-4 bg-neutral-800 rounded shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
