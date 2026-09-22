import React from 'react';
import { Play, Pause, ChevronUp } from 'lucide-react';
import { useMusic, useAudioTime } from '../context/MusicContext';

export const MiniPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    setIsPlayerOpen, 
    duration, 
    hasOpenedPlayerScreen, 
    isPlayerOpen 
  } = useMusic();

  const currentTime = useAudioTime();

  // MiniPlayer haipaswi kuonekana mpaka mtumiaji afungue player screen kwanza
  if (!hasOpenedPlayerScreen || isPlayerOpen || !currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="soundwave-mini-player"
      onClick={() => setIsPlayerOpen(true)}
      className="fixed bottom-[84px] left-3 right-3 md:left-auto md:right-6 md:w-96 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 flex items-center justify-between shadow-2xl z-40 cursor-pointer hover:border-white/20 transition-all active:scale-[0.99] select-none"
    >
      {/* Progress Line */}
      <div 
        className="absolute bottom-0 left-3 right-3 h-[2px] bg-neutral-700/40 rounded-full overflow-hidden"
      >
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-800 shrink-0 border border-white/5 relative shadow-md">
          {currentTrack.coverUrl ? (
            <img 
              src={currentTrack.coverUrl} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-neutral-800" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {currentTrack.title}
          </p>
          <p className="text-xs text-neutral-400 truncate">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="mini-player-play-btn"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current text-black" />
          ) : (
            <Play className="w-5 h-5 fill-current text-black translate-x-0.5" />
          )}
        </button>

        <button
          id="mini-player-expand-btn"
          aria-label="Expand player"
          onClick={(e) => {
            e.stopPropagation();
            setIsPlayerOpen(true);
          }}
          className="p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
