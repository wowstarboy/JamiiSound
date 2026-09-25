import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Play, 
  Pause, 
  Shuffle, 
  Clock, 
  Heart, 
  MoreVertical, 
  ListPlus, 
  Plus,
  Radio,
  Headphones,
  Share2
} from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMusic } from '../context/MusicContext';
import { AppLogo } from '../components/AppLogo';
import { formatTime, formatTotalDuration, formatNumber } from '../utils/formatters';
import { Track } from '../types';
import { Album as FirestoreAlbum } from '../types/collections';
import { fetchAlbumFullDataLazy } from '../services/firestoreMusicService';
import { AlbumSkeleton } from '../components/AlbumSkeleton';

export const AlbumDetailsView: React.FC = () => {
  const { 
    activeAlbumId, 
    playTrack, 
    currentTrack,
    isPlaying,
    togglePlay,
    navigateToArtist,
    navigateToAlbum,
    setCurrentTab,
    toggleShuffle,
    isShuffled,
    isLiked,
    toggleLike,
    addToQueue,
    playNext,
    playlists,
    addTrackToPlaylist,
    getAlbumById,
    getTracksByAlbumId,
    loadFullAlbumTracks
  } = useMusic();

  const [album, setAlbum] = useState<FirestoreAlbum | null>(() => 
    activeAlbumId ? getAlbumById(activeAlbumId) || null : null
  );
  
  // Local state for tracks with real-time Firestore synchronization
  const [albumTracks, setAlbumTracks] = useState<Track[]>(() => 
    activeAlbumId ? getTracksByAlbumId(activeAlbumId) : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [activePlaylistSubmenuId, setActivePlaylistSubmenuId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const handleShareAlbum = async () => {
    if (!album && !activeAlbumId) return;
    const albumTitle = album?.albumTitle || 'Album';
    const artistName = album?.artistName || albumTracks[0]?.artist || 'JamiiSound';
    const shareUrl = `${window.location.origin}/album/${activeAlbumId}`;

    const shareData = {
      title: `${albumTitle} - ${artistName}`,
      text: `Listen to "${albumTitle}" by ${artistName} on JamiiSound!`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 2500);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 2500);
      } catch (clipboardErr) {
        console.warn('Share error:', clipboardErr);
      }
    }
  };

  // Load all album details and tracks lazily from Firestore without limits
  useEffect(() => {
    if (!activeAlbumId) {
      setAlbum(null);
      setAlbumTracks([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const cachedAlbum = getAlbumById(activeAlbumId);
    const cachedTracks = getTracksByAlbumId(activeAlbumId);

    if (cachedAlbum) {
      setAlbum(cachedAlbum);
    }
    if (cachedTracks.length > 0) {
      setAlbumTracks(cachedTracks);
      if (cachedAlbum) {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
    }

    fetchAlbumFullDataLazy(activeAlbumId, cachedAlbum?.artistId)
      .then(({ album: loadedAlbum, tracks: loadedTracks }) => {
        if (!isMounted) return;
        if (loadedAlbum) {
          setAlbum(loadedAlbum);
        } else if (!cachedAlbum) {
          const fallback = getAlbumById(activeAlbumId);
          if (fallback) setAlbum(fallback);
        }

        if (loadedTracks.length > 0) {
          setAlbumTracks(loadedTracks);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Error loading album details from Firestore:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeAlbumId, getAlbumById, getTracksByAlbumId]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = () => {
      setActiveMenuTrackId(null);
      setActivePlaylistSubmenuId(null);
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const totalDuration = useMemo(() => 
    albumTracks.reduce((acc, t) => acc + (t.duration || 0), 0),
    [albumTracks]
  );

  const albumGenre = useMemo(() => {
    if (album?.genre) return album.genre;
    const trackWithGenre = albumTracks.find((t) => t.genre);
    return trackWithGenre?.genre || 'Bongo Flava';
  }, [album, albumTracks]);

  const handleBack = () => {
    setCurrentTab('home');
  };

  const handlePlayAll = () => {
    if (albumTracks.length > 0) {
      playTrack(albumTracks[0], albumTracks);
    }
  };

  const handleShufflePlay = () => {
    if (albumTracks.length > 0) {
      if (!isShuffled) toggleShuffle();
      const randomIdx = Math.floor(Math.random() * albumTracks.length);
      playTrack(albumTracks[randomIdx], albumTracks);
    }
  };

  const handleTrackClick = (track: Track, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      // Push history state with router link support
      if (album) {
        window.history.pushState(
          { tab: 'album-details', albumId: album.albumId, trackId: track.id }, 
          '', 
          `/album/${album.albumId}/track/${track.id}`
        );
      }
      playTrack(track, albumTracks);
    }
  };

  if (isLoading && !album) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 text-white gap-4">
        <p className="text-slate-400 text-sm">Album not found</p>
        <button
          onClick={handleBack}
          className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const coverArtUrl = album?.coverArt || albumTracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80';
  const releaseYear = album?.releaseYear || (album?.createdAt ? new Date(album.createdAt).getFullYear() : (albumTracks[0]?.releaseYear || ''));

  const totalAlbumListeners = useMemo(() => 
    albumTracks.reduce((acc, t) => acc + (t.plays || 0), 0),
    [albumTracks]
  );

  return (
    <div id="album-view-container" className="fixed inset-0 z-40 w-full h-[100dvh] overflow-y-auto overscroll-none text-white bg-black pb-28">
      {/* Background Hero Banner (blurred) */}
      <div className="absolute top-0 inset-x-0 h-[60vh] min-h-[400px] pointer-events-none overflow-hidden z-0">
        <img
          src={coverArtUrl}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover object-center blur-2xl scale-110 opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-4 md:px-8 py-3.5 mb-6 select-none">
        <button
          onClick={handleBack}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center text-white bg-transparent hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-white text-lg drop-shadow-md truncate px-4">
          {album?.artistName || albumTracks[0]?.artist || 'Artist'}
        </span>
        <button
          onClick={() => setCurrentTab('search')}
          aria-label="Search"
          className="w-10 h-10 flex items-center justify-center text-white bg-transparent hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <Search className="w-6 h-6" />
        </button>
      </header>

      {/* Album Info Section */}
      <div className="relative w-full flex flex-col pt-8 pb-6 px-4 sm:px-8 z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Cover Art */}
          <div className="shrink-0">
            <img
              src={coverArtUrl}
              alt={album?.albumTitle || 'Album Cover'}
              className="w-56 h-56 sm:w-64 sm:h-64 rounded-xl shadow-2xl object-cover pointer-events-auto"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Hero Content */}
          <div className="flex flex-col gap-3 w-full text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-wider">
                {album?.type || 'ALBUM'}
              </span>
              <span className="text-xs text-white/70">
                {albumTracks.length} {albumTracks.length === 1 ? 'Song' : 'Songs'}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/70">
                {formatNumber(totalAlbumListeners)} Total Listeners
              </span>
              {releaseYear && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-xs text-white/70">{releaseYear}</span>
                </>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg">
              {album?.albumTitle || 'Album'}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-white/90">
              {album?.artistId && (
                <button
                  onClick={() => navigateToArtist(album.artistId)}
                  className="font-bold text-white hover:underline transition-all drop-shadow"
                >
                  {album?.artistName || 'Artist'}
                </button>
              )}
              {totalDuration > 0 && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-xs text-white/70 font-mono">
                    {formatTotalDuration(totalDuration)}
                  </span>
                </>
              )}
            </div>

            {/* Action Buttons: Play Album & Shuffle */}
          <div className="flex items-center gap-4 pt-2">
            {albumTracks.length > 0 && (
              <button
                id="album-play-all-btn"
                onClick={handlePlayAll}
                className="px-7 py-3 rounded-full bg-white text-black font-bold text-sm flex items-center gap-2.5 shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
                <span>Play Album</span>
              </button>
            )}

            {albumTracks.length > 1 && (
              <button
                id="album-shuffle-btn"
                onClick={handleShufflePlay}
                className={`p-3 rounded-full backdrop-blur-md transition-all ${
                  isShuffled
                    ? 'bg-white text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Shuffle Play"
                aria-label="Shuffle Play"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            )}

            <button
              id="album-share-btn"
              onClick={handleShareAlbum}
              className="p-3 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 text-white transition-all relative"
              title="Share Album"
              aria-label="Share Album"
            >
              <Share2 className="w-5 h-5" />
              {shareFeedback && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-white text-[11px] px-2.5 py-1 rounded shadow-lg border border-white/10 z-50">
                  {shareFeedback}
                </span>
              )}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Tracklist - FULL WIDTH, TRANSPARENT, NO BACKGROUND BORDERS */}
      <div className="w-full bg-transparent px-2 sm:px-6 md:px-8 pt-4">
        {/* Tracklist Column Header */}
        <div className="hidden sm:flex items-center px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5 select-none">
          <div className="w-8 text-center mr-3">#</div>
          <div className="flex-1">Title</div>
          <div className="w-24 text-center">Plays</div>
          <div className="w-16 text-right flex items-center justify-end pr-2">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="w-10"></div>
        </div>

        {/* Tracks List */}
        {albumTracks.length === 0 ? (
          <div className="p-12 text-center text-white/40 text-sm">
            No tracks found for this album.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {albumTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isTrackLiked = isLiked(track.id);
              const trackNum = track.trackNumber !== undefined ? track.trackNumber : idx + 1;
              const isMenuOpen = activeMenuTrackId === track.id;
              const isSubmenuOpen = activePlaylistSubmenuId === track.id;

              return (
                <div
                  key={track.id}
                  id={`album-track-${track.id}`}
                  className={`group relative flex items-center px-3 sm:px-4 py-3 text-sm transition-colors cursor-pointer select-none ${
                    isCurrent ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/90'
                  }`}
                  onClick={(e) => handleTrackClick(track, e)}
                >
                  {/* Track Number / Play Status */}
                  <div className="w-8 flex items-center justify-center mr-3 shrink-0">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-4">
                        <span className="w-1 bg-white animate-[bounce_1s_infinite_100ms] h-full rounded-full" />
                        <span className="w-1 bg-white animate-[bounce_1s_infinite_300ms] h-3 rounded-full" />
                        <span className="w-1 bg-white animate-[bounce_1s_infinite_200ms] h-4 rounded-full" />
                      </div>
                    ) : (
                      <>
                        <span className={`group-hover:hidden font-mono text-xs ${isCurrent ? 'text-white font-bold' : 'text-white/40'}`}>
                          {trackNum}
                        </span>
                        <button
                          className="hidden group-hover:flex items-center justify-center text-white hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackClick(track);
                          }}
                          aria-label="Play track"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Song Title with Router Link */}
                  <div className="flex-1 min-w-0 pr-3">
                    <a
                      href={`/album/${album?.albumId || ''}/track/${track.id}`}
                      onClick={(e) => handleTrackClick(track, e)}
                      className={`truncate font-medium block ${
                        isCurrent ? 'text-white font-bold' : 'text-white hover:underline'
                      }`}
                    >
                      {track.title}
                    </a>
                    <div className="truncate text-xs text-white/50 hover:text-white/80 mt-0.5">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToArtist(track.artistId);
                        }}
                        className="hover:underline cursor-pointer"
                      >
                        {track.artist}
                      </span>
                      <span className="mx-1.5 opacity-50">•</span>
                      <span>
                        {new Intl.NumberFormat().format(track.plays || 0)} listeners
                      </span>
                    </div>
                  </div>

                  {/* Play count */}
                  <div className="hidden sm:block w-24 text-center text-xs text-white/50 font-mono">
                    {formatNumber(track.plays || 0)}
                  </div>

                  {/* Duration */}
                  <div className="w-16 text-right text-xs text-white/50 font-mono pr-2">
                    {formatTime(track.duration)}
                  </div>

                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(track.id);
                    }}
                    className={`p-2 transition-colors ${
                      isTrackLiked ? 'text-white' : 'text-white/30 opacity-0 group-hover:opacity-100 hover:text-white'
                    }`}
                    aria-label="Like"
                  >
                    <Heart className={`w-4 h-4 ${isTrackLiked ? 'fill-current' : ''}`} />
                  </button>

                  {/* More Options Dropdown Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuTrackId(isMenuOpen ? null : track.id);
                        setActivePlaylistSubmenuId(null);
                      }}
                      className="p-2 text-white/40 hover:text-white transition-colors"
                      aria-label="Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div
                        className="absolute right-0 top-full mt-1 w-52 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs select-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            addToQueue(track);
                            setActiveMenuTrackId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2.5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Queue</span>
                        </button>

                        <button
                          onClick={() => {
                            playNext(track);
                            setActiveMenuTrackId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2.5 transition-colors"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                          <span>Play Next</span>
                        </button>

                        <button
                          onClick={() => {
                            setActivePlaylistSubmenuId(isSubmenuOpen ? null : track.id);
                          }}
                          className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Playlist</span>
                          </div>
                          <span>›</span>
                        </button>

                        {/* Playlist sub-menu */}
                        {isSubmenuOpen && (
                          <div className="bg-neutral-950 border-t border-b border-neutral-800 my-1 py-1">
                            {playlists.length === 0 ? (
                              <div className="px-4 py-1 text-white/40 text-[11px]">
                                No playlists created
                              </div>
                            ) : (
                              playlists.map((pl) => (
                                <button
                                  key={pl.id}
                                  onClick={() => {
                                    addTrackToPlaylist(pl.id, track.id);
                                    setActiveMenuTrackId(null);
                                    setActivePlaylistSubmenuId(null);
                                  }}
                                  className="w-full px-6 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white truncate transition-colors"
                                >
                                  {pl.title}
                                </button>
                              ))
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            navigateToArtist(track.artistId);
                            setActiveMenuTrackId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2.5 transition-colors"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Go to Artist</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
