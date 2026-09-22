import React, { useState, useEffect, useRef } from 'react';
import { X, ListMusic, Trash2, History, Play, Pause, Loader2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { formatTime } from '../utils/formatters';
import { Track } from '../types';

const INITIAL_BATCH_SIZE = 15;
const LOAD_MORE_STEP = 15;

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    currentTrack,
    isPlaying,
    togglePlay,
    queue,
    queueIndex,
    history,
    playTrack,
    removeFromQueue,
    clearQueue,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset pagination count when queue changes or tab switches
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [queue.length, queueIndex, activeTab]);

  const upNextList = queue.slice(queueIndex + 1);
  const currentList: Track[] = activeTab === 'queue' ? upNextList : history;
  const hasMore = visibleCount < currentList.length;

  // Infinite loading observer when user scrolls down
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + LOAD_MORE_STEP);
            setIsLoadingMore(false);
          }, 200);
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, visibleCount, currentList.length]);

  if (!isQueueOpen) return null;

  const displayedQueueItems = upNextList.slice(0, visibleCount);
  const displayedHistoryItems = history.slice(0, visibleCount);

  return (
    <div 
      id="queue-drawer-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={() => setIsQueueOpen(false)}
    >
      <div 
        id="queue-drawer-panel"
        className="w-full max-w-md h-full bg-[#0c0c0e] border-l border-white/10 flex flex-col text-white shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white">Play Queue</h3>
          </div>
          <button
            id="queue-close-btn"
            className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800/80 transition-colors"
            onClick={() => setIsQueueOpen(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex px-5 pt-3 border-b border-white/10 gap-6 text-xs font-semibold">
          <button
            id="queue-tab-upnext"
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'queue' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
            onClick={() => setActiveTab('queue')}
          >
            <ListMusic className="w-4 h-4" />
            <span>Up Next ({upNextList.length})</span>
          </button>
          <button
            id="queue-tab-history"
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4" />
            <span>Recently Played ({history.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'queue' ? (
            <>
              {/* Currently Playing Card */}
              {currentTrack && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
                    <span>Now Playing</span>
                    <span className="text-white flex items-center gap-1.5 text-[11px] font-mono lowercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/90 border border-white/10">
                    <img 
                      src={currentTrack.coverUrl} 
                      alt={currentTrack.title}
                      className="w-12 h-12 rounded-xl object-cover shadow"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">
                        {currentTrack.title}
                      </div>
                      <div className="text-xs text-neutral-400 truncate">
                        {currentTrack.artist}
                      </div>
                    </div>
                    <button
                      className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Up Next List */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  <span>Up Next</span>
                  {upNextList.length > 0 && (
                    <button
                      id="queue-clear-btn"
                      className="text-neutral-400 hover:text-rose-400 text-xs font-normal normal-case flex items-center gap-1 transition-colors"
                      onClick={clearQueue}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Queue
                    </button>
                  )}
                </div>

                {upNextList.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs">
                    Queue is empty. Add songs from your library or explore tracks!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {displayedQueueItems.map((track, i) => {
                      const actualIdx = queueIndex + 1 + i;
                      return (
                        <div
                          key={`${track.id}-${actualIdx}`}
                          className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-800/60 transition-colors text-xs cursor-pointer border border-transparent hover:border-white/5"
                          onClick={() => playTrack(track)}
                        >
                          <span className="text-neutral-500 font-mono w-4 text-center">
                            {i + 1}
                          </span>
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-800"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-neutral-200 truncate group-hover:text-white">
                              {track.title}
                            </div>
                            <div className="text-neutral-400 truncate text-[11px] mt-0.5">
                              {track.artist}
                            </div>
                          </div>
                          <span className="text-neutral-500 font-mono">
                            {formatTime(track.duration)}
                          </span>
                          <button
                            className="p-1.5 text-neutral-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-neutral-700/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(actualIdx);
                            }}
                            title="Remove from queue"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              {history.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  No recently played tracks yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {displayedHistoryItems.map((track, idx) => (
                    <div
                      key={`hist-${track.id}-${idx}`}
                      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-800/60 transition-colors text-xs cursor-pointer border border-transparent hover:border-white/5"
                      onClick={() => playTrack(track)}
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover bg-neutral-800"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-200 truncate group-hover:text-white">
                          {track.title}
                        </div>
                        <div className="text-neutral-400 truncate text-[11px] mt-0.5">
                          {track.artist}
                        </div>
                      </div>
                      <span className="text-neutral-500 font-mono">
                        {formatTime(track.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Infinite Loading Sentinel & Spinner */}
          {hasMore && (
            <div ref={sentinelRef} className="py-4 flex justify-center items-center">
              <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
