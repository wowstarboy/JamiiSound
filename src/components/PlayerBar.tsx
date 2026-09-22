import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Heart, 
  Mic2, 
  Activity, 
  ListMusic, 
  Sliders, 
  Clock,
  ChevronUp
} from 'lucide-react';
import { useMusic, useAudioTime } from '../context/MusicContext';
import { formatTime } from '../utils/formatters';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    isLiked,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    setIsLyricsOpen,
    setIsVisualizerOpen,
    setIsQueueOpen,
    setIsEqualizerOpen,
    navigateToArtist,
    sleepTimerRemaining,
    setSleepTimer,
  } = useMusic();

  const currentTime = useAudioTime();

  const [sleepMenuOpen, setSleepMenuOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  return (
    <footer 
      id="soundwave-player-bar"
      className="fixed bottom-0 left-0 right-0 h-24 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-4 md:px-6 z-40 flex items-center justify-between select-none shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
    >
      {/* 1. Track Info (Left) */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px] max-w-xs">
        <div className="relative group shrink-0">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-14 h-14 rounded-xl object-cover shadow-md border border-slate-700/50"
            referrerPolicy="no-referrer"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-sm text-slate-100 hover:text-emerald-400 cursor-pointer transition-colors">
            {currentTrack.title}
          </div>
          <div 
            className="truncate text-xs text-slate-400 hover:text-slate-200 cursor-pointer mt-0.5 hover:underline"
            onClick={() => navigateToArtist(currentTrack.artistId)}
          >
            {currentTrack.artist}
          </div>
        </div>

        <button
          id="player-like-btn"
          className={`p-2 rounded-full transition-transform active:scale-90 ${
            isLiked(currentTrack.id) 
              ? 'text-rose-500 hover:text-rose-400' 
              : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => toggleLike(currentTrack.id)}
          title={isLiked(currentTrack.id) ? 'Unlike song' : 'Like song'}
        >
          <Heart className={`w-4 h-4 ${isLiked(currentTrack.id) ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* 2. Controls & Progress Bar (Center) */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-2xl px-4">
        {/* Buttons Row */}
        <div className="flex items-center gap-4 md:gap-6 mb-2">
          {/* Shuffle */}
          <button
            id="player-shuffle-btn"
            className={`p-1.5 rounded-lg transition-colors ${
              isShuffled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'
            }`}
            onClick={toggleShuffle}
            title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Prev */}
          <button
            id="player-prev-btn"
            className="p-1.5 text-slate-300 hover:text-white transition-transform active:scale-95"
            onClick={prevTrack}
            title="Previous (Ctrl+Left)"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Big Play / Pause button */}
          <button
            id="player-play-pause-btn"
            className="w-11 h-11 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:scale-105 active:scale-95 transition-all"
            onClick={togglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            id="player-next-btn"
            className="p-1.5 text-slate-300 hover:text-white transition-transform active:scale-95"
            onClick={nextTrack}
            title="Next (Ctrl+Right)"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat */}
          <button
            id="player-repeat-btn"
            className={`p-1.5 rounded-lg transition-colors relative ${
              repeatMode !== 'off' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'
            }`}
            onClick={cycleRepeat}
            title={`Repeat mode: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <div
            ref={progressBarRef}
            id="player-progress-bar"
            className="relative flex-1 h-2 group cursor-pointer flex items-center"
            onClick={handleSeek}
          >
            {/* Background Track */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 group-hover:h-2 transition-all relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Scrubber thumb */}
            <div
              className="absolute w-3.5 h-3.5 bg-white rounded-full shadow -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Utility & Volume Controls (Right) */}
      <div className="flex items-center justify-end gap-2 md:gap-3 w-1/4 min-w-[180px]">
        {/* Sleep Timer button with dropdown */}
        <div className="relative">
          <button
            id="player-sleep-timer-btn"
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              sleepTimerRemaining !== null ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            onClick={() => setSleepMenuOpen(!sleepMenuOpen)}
            title="Sleep Timer"
          >
            <Clock className="w-4 h-4" />
            {sleepTimerRemaining !== null && (
              <span className="text-[10px] font-mono font-bold">
                {Math.ceil(sleepTimerRemaining / 60)}m
              </span>
            )}
          </button>

          {sleepMenuOpen && (
            <div className="absolute right-0 bottom-12 w-44 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-xs text-slate-200">
              <div className="px-2 py-1 font-semibold text-slate-400 uppercase text-[10px]">
                Sleep Timer
              </div>
              <button
                className="w-full px-2 py-1.5 text-left rounded hover:bg-slate-800 flex justify-between"
                onClick={() => { setSleepTimer(15); setSleepMenuOpen(false); }}
              >
                <span>15 minutes</span>
              </button>
              <button
                className="w-full px-2 py-1.5 text-left rounded hover:bg-slate-800 flex justify-between"
                onClick={() => { setSleepTimer(30); setSleepMenuOpen(false); }}
              >
                <span>30 minutes</span>
              </button>
              <button
                className="w-full px-2 py-1.5 text-left rounded hover:bg-slate-800 flex justify-between"
                onClick={() => { setSleepTimer(45); setSleepMenuOpen(false); }}
              >
                <span>45 minutes</span>
              </button>
              <button
                className="w-full px-2 py-1.5 text-left rounded hover:bg-slate-800 flex justify-between"
                onClick={() => { setSleepTimer(60); setSleepMenuOpen(false); }}
              >
                <span>1 hour</span>
              </button>
              {sleepTimerRemaining !== null && (
                <button
                  className="w-full px-2 py-1.5 text-left rounded hover:bg-slate-800 text-rose-400 mt-1 border-t border-slate-800"
                  onClick={() => { setSleepTimer(null); setSleepMenuOpen(false); }}
                >
                  Turn Off Timer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Karaoke Lyrics */}
        <button
          id="player-lyrics-btn"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          onClick={() => setIsLyricsOpen(true)}
          title="Karaoke Lyrics (L)"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Visualizer */}
        <button
          id="player-viz-btn"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          onClick={() => setIsVisualizerOpen(true)}
          title="Audio Spectrum Visualizer (V)"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Equalizer */}
        <button
          id="player-eq-btn"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          onClick={() => setIsEqualizerOpen(true)}
          title="Equalizer DSP"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Queue Drawer */}
        <button
          id="player-queue-btn"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          onClick={() => setIsQueueOpen(true)}
          title="Play Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume Slider */}
        <div className="hidden md:flex items-center gap-2 pl-1">
          <button
            id="player-mute-btn"
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            onClick={toggleMute}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            id="player-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-slate-800 accent-emerald-400 rounded-lg cursor-pointer"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>
      </div>
    </footer>
  );
};
