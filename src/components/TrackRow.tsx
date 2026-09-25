import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Heart, MoreVertical, Plus, ListPlus, Radio } from 'lucide-react';
import { Track } from '../types';
import { useMusic } from '../context/MusicContext';
import { formatTime, formatNumber } from '../utils/formatters';

interface TrackRowProps {
  track: Track;
  index: number;
  showAlbum?: boolean;
  contextQueue?: Track[];
}

export const TrackRow: React.FC<TrackRowProps> = ({ 
  track, 
  index, 
  showAlbum = true, 
  contextQueue 
}) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    isLiked,
    toggleLike,
    addToQueue,
    playNext,
    playlists,
    addTrackToPlaylist,
    navigateToArtist,
    navigateToAlbum,
  } = useMusic();

  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistSubmenu, setPlaylistSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCurrent = currentTrack?.id === track.id;

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, contextQueue);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPlaylistSubmenu(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div 
      id={`track-row-${track.id}`}
      className={`group flex items-center px-4 py-2.5 rounded-xl text-sm transition-colors duration-150 cursor-pointer bg-transparent ${
        isCurrent ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-white/5 text-slate-300'
      }`}
      onClick={handleRowClick}
    >
      {/* Index or Play/Pause icon */}
      <div className="w-8 flex items-center justify-center mr-3 shrink-0">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4">
            <span className="w-1 bg-emerald-400 animate-[bounce_1s_infinite_100ms] h-full rounded-full" />
            <span className="w-1 bg-emerald-400 animate-[bounce_1s_infinite_300ms] h-3 rounded-full" />
            <span className="w-1 bg-emerald-400 animate-[bounce_1s_infinite_200ms] h-4 rounded-full" />
          </div>
        ) : (
          <>
            <span className={`group-hover:hidden font-mono text-xs ${isCurrent ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              {index + 1}
            </span>
            <button 
              id={`track-play-btn-${track.id}`}
              className="hidden group-hover:flex items-center justify-center text-white hover:text-emerald-400"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick();
              }}
            >
              {isCurrent && isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          </>
        )}
      </div>

      {/* Artwork thumbnail */}
      <img 
        src={track.coverUrl} 
        alt={track.title}
        className="w-10 h-10 rounded-lg object-cover mr-3 shrink-0 shadow-sm"
        referrerPolicy="no-referrer"
      />

      {/* Title & Artist */}
      <div className="flex-1 min-w-0 pr-4">
        <div className={`truncate font-medium ${isCurrent ? 'text-emerald-400 font-semibold' : 'text-slate-100 group-hover:text-white'}`}>
          {track.title}
        </div>
        <div className="truncate text-xs text-slate-400 hover:text-slate-200 mt-0.5 flex items-center gap-1.5">
          <span 
            onClick={(e) => {
              e.stopPropagation();
              navigateToArtist(track.artistId);
            }}
            className="hover:underline cursor-pointer"
          >
            {track.artist}
          </span>
          {/* Hidden count */}
        </div>
      </div>

      {/* Play/Listeners count (desktop) */}
      <div className="hidden sm:block w-20 text-right pr-3 text-xs text-slate-400 font-mono"></div>

      {/* Album name (desktop) */}
      {showAlbum && (
        <div className="hidden md:block w-48 text-xs text-slate-400 truncate pr-4">
          <span 
            onClick={(e) => {
              e.stopPropagation();
              navigateToAlbum(track.albumId);
            }}
            className="hover:text-slate-200 hover:underline cursor-pointer"
          >
            {track.album}
          </span>
        </div>
      )}

      {/* Genre tag */}
      <div className="hidden lg:block w-28 text-xs text-slate-400">
        <span className="text-[11px] text-neutral-400">
          {track.genre}
        </span>
      </div>

      {/* Like button */}
      <button
        id={`track-like-btn-${track.id}`}
        className={`p-1.5 rounded-full transition-colors mr-2 shrink-0 ${
          isLiked(track.id) 
            ? 'text-rose-500 hover:text-rose-400' 
            : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          toggleLike(track.id);
        }}
        title={isLiked(track.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
      >
        <Heart className={`w-4 h-4 ${isLiked(track.id) ? 'fill-current' : ''}`} />
      </button>

      {/* Duration */}
      <div className="w-12 text-right text-xs text-slate-400 font-mono shrink-0">
        {formatTime(track.duration)}
      </div>

      {/* Context Actions Menu */}
      <div className="relative ml-2" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button
          id={`track-menu-btn-${track.id}`}
          className="p-1.5 text-slate-400 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-50 w-48 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-xs text-slate-200">
            <button
              id={`menu-add-queue-${track.id}`}
              className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-800 transition-colors"
              onClick={() => {
                addToQueue(track);
                setMenuOpen(false);
              }}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add to Queue</span>
            </button>
            <button
              id={`menu-play-next-${track.id}`}
              className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-800 transition-colors"
              onClick={() => {
                playNext(track);
                setMenuOpen(false);
              }}
            >
              <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Play Next</span>
            </button>

            {/* Submenu for playlists */}
            <div className="border-t border-slate-800 my-1 pt-1">
              <div 
                className="px-3 py-1.5 text-slate-400 uppercase tracking-wider font-semibold text-[10px] flex items-center justify-between cursor-pointer hover:text-slate-200"
                onClick={() => setPlaylistSubmenu(!playlistSubmenu)}
              >
                <span>Add to Playlist</span>
                <span className="text-slate-400">›</span>
              </div>
              {playlistSubmenu && (
                <div className="max-h-32 overflow-y-auto py-1 pl-2">
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 hover:text-emerald-400 truncate rounded flex items-center gap-1.5"
                      onClick={() => {
                        addTrackToPlaylist(pl.id, track.id);
                        setMenuOpen(false);
                        setPlaylistSubmenu(false);
                      }}
                    >
                      <Radio className="w-3 h-3 text-slate-500" />
                      <span className="truncate">{pl.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
