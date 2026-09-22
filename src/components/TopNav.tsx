import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Sliders, 
  Activity, 
  Mic2, 
  Sparkles,
  Clock
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const TopNav: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    searchQuery,
    setSearchQuery,
    setIsEqualizerOpen,
    setIsVisualizerOpen,
    setIsLyricsOpen,
    sleepTimerRemaining,
    isPlaying,
  } = useMusic();

  return (
    <header 
      id="soundwave-top-nav"
      className="h-16 px-6 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between z-30 shrink-0 sticky top-0"
    >
      {/* Left: Navigation Buttons & Optional Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-1.5">
          <button
            id="nav-back-btn"
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => setCurrentTab('home')}
            title="Go to Home"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="nav-forward-btn"
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => setCurrentTab('search')}
            title="Go to Search"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search input (always available or highlighted) */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search songs, artists, albums, or genres..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (currentTab !== 'search') {
                setCurrentTab('search');
              }
            }}
            onFocus={() => {
              if (currentTab !== 'search') setCurrentTab('search');
            }}
            className="w-full pl-9 pr-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right: Quick actions & Audio Engine Status */}
      <div className="flex items-center gap-3">
        {/* Sleep timer status if active */}
        {sleepTimerRemaining !== null && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>{Math.ceil(sleepTimerRemaining / 60)}m sleep</span>
          </div>
        )}

        {/* Equalizer pill */}
        <button
          id="topnav-eq-btn"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
          onClick={() => setIsEqualizerOpen(true)}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Equalizer</span>
        </button>

        {/* Visualizer pill */}
        <button
          id="topnav-viz-btn"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
          onClick={() => setIsVisualizerOpen(true)}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Visualizer</span>
        </button>

        {/* Audio status indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="hidden md:inline">Hi-Fi Audio</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            SW
          </div>
        </div>
      </div>
    </header>
  );
};
