import React, { useEffect, useRef } from 'react';
import { X, Mic2, Sparkles } from 'lucide-react';
import { useMusic, useAudioTime } from '../context/MusicContext';
import { formatTime } from '../utils/formatters';

export const LyricsModal: React.FC = () => {
  const { 
    isLyricsOpen, 
    setIsLyricsOpen, 
    currentTrack, 
    seek, 
  } = useMusic();

  const currentTime = useAudioTime();

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lyrics = currentTrack?.lyrics || [];

  // Determine current active lyric index
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth auto-scroll to keep active line centered
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && isLyricsOpen) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, isLyricsOpen]);

  if (!isLyricsOpen) return null;

  return (
    <div 
      id="lyrics-modal-overlay"
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl text-white overflow-hidden transition-all duration-300"
    >
      {/* Subtle blurred background cover image */}
      {currentTrack && (
        <div 
          className="absolute inset-0 opacity-15 filter blur-3xl scale-125 pointer-events-none transition-all duration-700"
          style={{
            backgroundImage: `url(${currentTrack.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-white/5 border border-white/10 text-white">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Synchronized Lyrics
            </h2>
            <p className="text-xs text-neutral-400">
              {currentTrack ? `${currentTrack.title} — ${currentTrack.artist}` : 'No track'}
            </p>
          </div>
        </div>

        <button
          id="lyrics-close-btn"
          className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          onClick={() => setIsLyricsOpen(false)}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lyrics container */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-1 overflow-y-auto px-6 py-16 flex flex-col items-center max-w-4xl mx-auto w-full space-y-6 select-none"
      >
        {lyrics.length === 0 ? (
          <div className="text-center my-auto py-12">
            <Sparkles className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-lg font-semibold text-white">Instrumental or No Lyrics Available</p>
            <p className="text-xs text-neutral-400 mt-1">Enjoy the music streaming experience.</p>
          </div>
        ) : (
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                id={`lyric-line-${idx}`}
                className={`group w-full max-w-2xl text-center py-2.5 px-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? 'text-white text-2xl md:text-3xl font-extrabold scale-105 drop-shadow-[0_0_24px_rgba(255,255,255,0.4)]' 
                    : isPast 
                    ? 'text-neutral-500 text-lg md:text-xl font-medium hover:text-neutral-300' 
                    : 'text-neutral-600 text-lg md:text-xl font-medium hover:text-neutral-400'
                }`}
                onClick={() => seek(line.time)}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{line.text}</span>
                  <span className="opacity-0 group-hover:opacity-100 text-xs font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 transition-opacity">
                    {formatTime(line.time)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Hint */}
      <div className="relative z-10 py-3 border-t border-white/10 text-center text-xs text-neutral-400 bg-black/60">
        Tap any lyric line to jump directly to that timestamp
      </div>
    </div>
  );
};
