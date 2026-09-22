import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  Library, 
  Heart, 
  PlusSquare, 
  Radio, 
  Music, 
  Disc3, 
  Sparkles, 
  Keyboard
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { NavigationTab } from '../types';

interface SidebarProps {
  onOpenCreatePlaylist: () => void;
  onOpenShortcuts: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onOpenCreatePlaylist, 
  onOpenShortcuts 
}) => {
  const { 
    currentTab, 
    setCurrentTab, 
    likedTrackIds, 
    playlists, 
    navigateToPlaylist, 
    activePlaylistId 
  } = useMusic();

  return (
    <aside 
      id="soundwave-sidebar"
      className="hidden md:flex flex-col w-64 bg-[#000000] border-r border-neutral-900 p-4 shrink-0 select-none h-full"
    >
      {/* Brand Logo */}
      <div 
        className="flex items-center gap-3 px-2 py-3 cursor-pointer group"
        onClick={() => setCurrentTab('home')}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all">
          <div className="w-full h-full bg-[#000000] rounded-[10px] flex items-center justify-center">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            SoundWave
          </h1>
          <p className="text-[10px] uppercase font-mono tracking-widest text-emerald-400">
            Music Stream
          </p>
        </div>
      </div>

      {/* Main Nav Links */}
      <nav className="mt-6 space-y-1">
        <button
          id="nav-tab-home"
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentTab === 'home'
              ? 'bg-slate-800/90 text-emerald-400 shadow-sm font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
          onClick={() => setCurrentTab('home')}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          id="nav-tab-search"
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentTab === 'search'
              ? 'bg-slate-800/90 text-emerald-400 shadow-sm font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
          onClick={() => setCurrentTab('search')}
        >
          <Search className="w-5 h-5" />
          <span>Search & Browse</span>
        </button>

        <button
          id="nav-tab-library"
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentTab === 'library'
              ? 'bg-slate-800/90 text-emerald-400 shadow-sm font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
          onClick={() => setCurrentTab('library')}
        >
          <Library className="w-5 h-5" />
          <span>Your Library</span>
        </button>
      </nav>

      {/* Secondary section: Liked Songs & Create Playlist */}
      <div className="mt-7 pt-4 border-t border-slate-800/60 space-y-1">
        <button
          id="nav-btn-liked-songs"
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
            currentTab === 'favorites'
              ? 'bg-slate-800/90 text-rose-400 font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
          onClick={() => setCurrentTab('favorites')}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white fill-current" />
            </div>
            <span>Liked Songs</span>
          </div>
          <span className="text-xs font-mono text-slate-500 group-hover:text-slate-300">
            {likedTrackIds.length}
          </span>
        </button>

        <button
          id="nav-btn-create-playlist"
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/40 transition-colors"
          onClick={onOpenCreatePlaylist}
        >
          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-emerald-400">
            <PlusSquare className="w-4 h-4" />
          </div>
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Playlists List */}
      <div className="mt-5 flex-1 flex flex-col min-h-0">
        <div className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Playlists
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {playlists.map((pl) => {
            const isActive = currentTab === 'playlist-details' && activePlaylistId === pl.id;
            return (
              <button
                key={pl.id}
                id={`sidebar-playlist-${pl.id}`}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs truncate transition-colors flex items-center justify-between ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
                onClick={() => navigateToPlaylist(pl.id)}
              >
                <span className="truncate">{pl.title}</span>
                {pl.isCustom && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 ml-1">
                    Custom
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer shortcut helper */}
      <div className="pt-3 border-t border-slate-800/60">
        <button
          id="btn-open-shortcuts"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          onClick={onOpenShortcuts}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Keyboard Shortcuts</span>
        </button>
      </div>
    </aside>
  );
};
