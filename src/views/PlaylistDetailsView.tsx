import React from 'react';
import { Play, Shuffle, Trash2, Clock, Music } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { TRACKS } from '../data/musicData';
import { TrackRow } from '../components/TrackRow';
import { formatTotalDuration } from '../utils/formatters';

export const PlaylistDetailsView: React.FC = () => {
  const { 
    activePlaylistId, 
    playlists, 
    playTrack, 
    deletePlaylist, 
    removeTrackFromPlaylist,
    toggleShuffle,
    isShuffled
  } = useMusic();

  const playlist = playlists.find((p) => p.id === activePlaylistId);

  if (!playlist) {
    return (
      <div className="text-center py-20 text-slate-400">
        Playlist not found.
      </div>
    );
  }

  const playlistTracks = TRACKS.filter((t) => playlist.trackIds.includes(t.id));
  const totalDuration = playlistTracks.reduce((acc, t) => acc + t.duration, 0);

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
    }
  };

  const handleShufflePlay = () => {
    if (playlistTracks.length > 0) {
      if (!isShuffled) toggleShuffle();
      const randomIdx = Math.floor(Math.random() * playlistTracks.length);
      playTrack(playlistTracks[randomIdx], playlistTracks);
    }
  };

  return (
    <div id="playlist-details-container" className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950/70 border border-slate-800 shadow-2xl">
        <img
          src={playlist.coverUrl}
          alt={playlist.title}
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl object-cover shadow-2xl shrink-0 border border-slate-700/60"
          referrerPolicy="no-referrer"
        />

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Playlist
            </span>
            {playlist.isCustom && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                Custom Created
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {playlist.title}
          </h1>

          <p className="text-sm text-slate-300 max-w-2xl">
            {playlist.description}
          </p>

          <div className="text-xs text-slate-400 font-medium flex items-center gap-2 pt-2">
            <span className="text-slate-200 font-semibold">{playlist.curator || 'SoundWave'}</span>
            <span>•</span>
            <span>{playlistTracks.length} songs</span>
            <span>•</span>
            <span className="font-mono">{formatTotalDuration(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          {playlistTracks.length > 0 && (
            <>
              <button
                id="playlist-play-all-btn"
                className="px-6 py-3 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-105 transition-transform"
                onClick={handlePlayAll}
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                <span>Play All</span>
              </button>

              <button
                id="playlist-shuffle-btn"
                className="p-3 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                onClick={handleShufflePlay}
                title="Shuffle Play"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {playlist.isCustom && (
          <button
            id="playlist-delete-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
            onClick={() => deletePlaylist(playlist.id)}
            title="Delete this custom playlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Playlist</span>
          </button>
        )}
      </div>

      {/* Tracklist Table */}
      {playlistTracks.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-3">
          <Music className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">Playlist is empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Find songs from Search or Home and click the three dots menu (⋮) to add them to this playlist.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-2 divide-y divide-slate-800/60">
          <div className="hidden sm:flex items-center px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="w-8 text-center mr-3">#</div>
            <div className="w-10 mr-3">Cover</div>
            <div className="flex-1">Title & Artist</div>
            <div className="w-48">Album</div>
            <div className="w-28">Genre</div>
            <div className="w-12 text-right">Time</div>
            <div className="w-12"></div>
          </div>
          {playlistTracks.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              contextQueue={playlistTracks}
            />
          ))}
        </div>
      )}
    </div>
  );
};
