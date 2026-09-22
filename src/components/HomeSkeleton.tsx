import React from 'react';

export const HomeSkeleton: React.FC = () => {
  return (
    <div id="home-skeleton" className="space-y-8 animate-pulse px-4 md:px-8">
      {/* 1. Trending Songs Skeleton */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-44 bg-neutral-800/80 rounded-md"></div>
          <div className="h-3 w-56 bg-neutral-800/50 rounded-md"></div>
        </div>
        <div className="grid grid-flow-col auto-cols-[160px] sm:auto-cols-[190px] md:auto-cols-[220px] gap-5 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`sk-trending-${i}`} className="flex flex-col space-y-3">
              <div className="aspect-square bg-neutral-800/70 rounded-2xl"></div>
              <div className="h-4 w-3/4 bg-neutral-800/80 rounded-md"></div>
              <div className="h-3 w-1/2 bg-neutral-800/50 rounded-md"></div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Jump Back In Skeleton */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-neutral-800/80 rounded-md"></div>
          <div className="h-3 w-48 bg-neutral-800/50 rounded-md"></div>
        </div>
        <div className="grid grid-flow-col auto-cols-[160px] sm:auto-cols-[190px] md:auto-cols-[220px] gap-5 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`sk-jump-${i}`} className="flex flex-col space-y-3">
              <div className="aspect-square bg-neutral-800/70 rounded-2xl"></div>
              <div className="h-4 w-3/4 bg-neutral-800/80 rounded-md"></div>
              <div className="h-3 w-1/2 bg-neutral-800/50 rounded-md"></div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Top Artists Skeleton */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-neutral-800/80 rounded-md"></div>
          <div className="h-3 w-64 bg-neutral-800/50 rounded-md"></div>
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`sk-top-artist-${i}`} className="shrink-0 flex flex-col items-center space-y-3 w-36 sm:w-44">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-neutral-800/70"></div>
              <div className="h-4 w-28 bg-neutral-800/80 rounded-md"></div>
              <div className="h-3 w-20 bg-neutral-800/50 rounded-md"></div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Top Songs Skeleton */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-neutral-800/80 rounded-md"></div>
          <div className="h-3 w-52 bg-neutral-800/50 rounded-md"></div>
        </div>
        <div className="grid grid-flow-col auto-cols-[160px] sm:auto-cols-[190px] md:auto-cols-[220px] gap-5 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`sk-top-song-${i}`} className="flex flex-col space-y-3">
              <div className="aspect-square bg-neutral-800/70 rounded-2xl"></div>
              <div className="h-4 w-3/4 bg-neutral-800/80 rounded-md"></div>
              <div className="h-3 w-1/2 bg-neutral-800/50 rounded-md"></div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Popular Artists Skeleton */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-neutral-800/80 rounded-md"></div>
          <div className="h-3 w-48 bg-neutral-800/50 rounded-md"></div>
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`sk-pop-artist-${i}`} className="shrink-0 flex flex-col items-center space-y-3 w-36 sm:w-44">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-neutral-800/70"></div>
              <div className="h-4 w-28 bg-neutral-800/80 rounded-md"></div>
              <div className="h-3 w-20 bg-neutral-800/50 rounded-md"></div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. New Releases Skeleton */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-neutral-800/80 rounded-md"></div>
          <div className="h-3 w-48 bg-neutral-800/50 rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={`sk-album-${i}`} className="flex flex-col space-y-3">
              <div className="aspect-square bg-neutral-800/70 rounded-2xl"></div>
              <div className="h-4 w-3/4 bg-neutral-800/80 rounded-md"></div>
              <div className="h-3 w-1/2 bg-neutral-800/50 rounded-md"></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
