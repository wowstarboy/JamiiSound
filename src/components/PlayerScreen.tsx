import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  MoreVertical, 
  Heart, 
  Shuffle, 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Repeat, 
  Repeat1,
  Share2,
  User,
  Check,
  ListPlus,
  ListMusic,
  Plus,
  X
} from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMusic, useAudioTime } from '../context/MusicContext';
import { AppLogo } from './AppLogo';
import { formatTime } from '../utils/formatters';

interface PlayerScreenProps {
  onClose: () => Unit | void;
}

type Unit = void;

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ onClose }) => {
  const {
    currentTrack,
    isPlaying,
    duration,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    isShuffled,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    toggleLike,
    isLiked: contextIsLiked,
    navigateToArtist,
    playlists,
    addTrackToPlaylist,
    createPlaylist,
  } = useMusic();

  const currentTime = useAudioTime();

  // Component local states strictly matching PlaybackState & remember in Jetpack Compose
  const title = currentTrack?.title || 'Unknown Title';
  const artist = currentTrack?.artist || 'Unknown Artist';
  const coverUrl = currentTrack?.coverUrl || '';
  const songId = currentTrack?.id || '';
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isMarquee, setIsMarquee] = useState(false);

  useEffect(() => {
    if (titleRef.current) {
      setIsMarquee(titleRef.current.scrollWidth > (titleRef.current.parentElement?.clientWidth || 0));
    }
  }, [title]);

  const [currentPos, setCurrentPos] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(180);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [sliderProgress, setSliderProgress] = useState<number>(0);

  const [isShuffle, setIsShuffle] = useState<boolean>(isShuffled);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState<boolean>(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState<string>('');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const handleShare = async () => {
    if (!currentTrack) return;
    
    // Construct real deep link to the track player screen
    const shareUrl = `${window.location.origin}/player/${currentTrack.id}`;

    const shareData = {
      title: `${currentTrack.title} - ${currentTrack.artist}`,
      text: `Listen to "${currentTrack.title}" by ${currentTrack.artist} on JamiiSound!`,
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
      // User dismissed or aborted share
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 2500);
      } catch (clipboardErr) {
        console.warn('Share/Clipboard error:', clipboardErr);
      }
    }
  };

  const handleViewArtist = () => {
    if (!currentTrack) return;
    const targetArtistId = currentTrack.artistId || currentTrack.artist;
    navigateToArtist(targetArtistId);
    onClose();
  };

  // Device / Anonymous UID for Firestore likes
  const [currentUid, setCurrentUid] = useState<string>(() => {
    let saved = localStorage.getItem('jamiisound_device_uid');
    if (!saved) {
      saved = 'user_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('jamiisound_device_uid', saved);
    }
    return saved;
  });

  // Keep shuffle and like in sync with context
  useEffect(() => {
    setIsShuffle(isShuffled);
  }, [isShuffled]);

  // Check if song is liked from Firestore & context
  useEffect(() => {
    if (!songId) return;

    let cancelled = false;
    const initialLiked = contextIsLiked(songId);
    setIsLiked(initialLiked);

    async function checkFirestoreLike() {
      try {
        const songRef = doc(db, 'songs', songId);
        const snap = await getDoc(songRef);
        if (snap.exists() && !cancelled) {
          const data = snap.data();
          const likes = Array.isArray(data.likes) ? data.likes : [];
          if (likes.includes(currentUid)) {
            setIsLiked(true);
          }
        }
      } catch (err) {
        // Fallback to local like state
      }
    }

    checkFirestoreLike();
    return () => {
      cancelled = true;
    };
  }, [songId, currentUid, contextIsLiked]);

  // Continuously update position and duration (in milliseconds, matching Kotlin state)
  useEffect(() => {
    if (!isDraggingSlider) {
      const posMs = Math.round(currentTime * 1000);
      const durMs = Math.round(Math.max(duration, 1) * 1000);
      setCurrentPos(posMs);
      setTotalDuration(durMs);
      if (durMs > 0) {
        setSliderProgress(posMs / durMs);
      }
    }
  }, [currentTime, duration, isDraggingSlider]);

  // Format millisecond duration to mm:ss matching Kotlin formatDuration
  const formatDurationMs = (ms: number): string => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    return formatTime(totalSec);
  };

  // Like button handler: updates Firestore arrayUnion / arrayRemove & likeCount
  const handleToggleLike = async () => {
    if (!songId) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    toggleLike(songId);

    try {
      const songRef = doc(db, 'songs', songId);
      if (nextLiked) {
        await updateDoc(songRef, {
          likes: arrayUnion(currentUid),
          likeCount: increment(1)
        });
      } else {
        await updateDoc(songRef, {
          likes: arrayRemove(currentUid),
          likeCount: increment(-1)
        });
      }
    } catch (e) {
      console.warn('Firestore like update notice (saved locally):', e);
    }
  };

  // Slider change handling
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDraggingSlider(true);
    const val = parseFloat(e.target.value);
    setSliderProgress(val);
    setCurrentPos(Math.round(val * totalDuration));
  };

  const handleSliderCommit = () => {
    const targetSeconds = (sliderProgress * totalDuration) / 1000;
    seek(targetSeconds);
    setIsDraggingSlider(false);
  };

  // Previous button behavior: if currentPos > 3000ms, seek to 0, else play previous
  const handlePrevious = () => {
    if (currentPos > 3000) {
      seek(0);
      setCurrentPos(0);
      setSliderProgress(0);
    } else {
      prevTrack();
    }
  };

  return (
    <div 
      id="player-screen-root"
      className="fixed inset-0 z-50 h-[100dvh] overscroll-none overflow-hidden flex flex-col justify-between select-none animate-in slide-in-from-bottom duration-300 bg-black text-white"
    >
      {/* AnimatedAppBackground: Pulsing subtle ambient backdrop reflecting album cover */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {coverUrl ? (
          <div 
            className="absolute -inset-20 bg-cover bg-center blur-3xl opacity-20 scale-125 transition-all duration-1000 animate-pulse"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-black opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95" />
      </div>

      {/* 1. Top Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 w-full px-4 md:px-8 py-3.5 flex items-center justify-between select-none">
        <button
          id="player-screen-close-btn"
          onClick={onClose}
          aria-label="Close"
          className="p-2 -ml-2 text-white hover:opacity-80 transition-opacity active:scale-95"
        >
          <ChevronDown className="w-8 h-8 text-white" />
        </button>

        <span className="text-sm font-bold tracking-wide text-white">
          Now Playing
        </span>

        <div className="relative">
          <button
            id="player-screen-more-btn"
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            aria-label="Options"
            className="p-2 -mr-2 text-white hover:opacity-80 transition-opacity active:scale-95"
          >
            <MoreVertical className="w-6 h-6 text-white" />
          </button>

          {/* Quick Options Dropdown */}
          {showOptionsMenu && (
            <div 
              className="absolute right-0 top-11 w-52 bg-neutral-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl py-2 z-50 flex flex-col text-sm text-neutral-200 animate-in fade-in zoom-in-95 duration-150 divide-y divide-white/5"
            >
              <button
                id="player-option-add-to-playlist"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowPlaylistModal(true);
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left transition-colors"
              >
                <ListPlus className="w-4 h-4 text-white" />
                <span>Add to Playlist</span>
              </button>
              <button
                id="player-option-share"
                onClick={() => {
                  setShowOptionsMenu(false);
                  handleShare();
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left transition-colors"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span>Share</span>
              </button>
              <button
                id="player-option-view-artist"
                onClick={() => {
                  setShowOptionsMenu(false);
                  handleViewArtist();
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left transition-colors"
              >
                <User className="w-4 h-4 text-white" />
                <span>View Artist</span>
              </button>
            </div>
          )}
        </div>

        {/* Floating Share / Playlist Feedback Toast */}
        {shareFeedback && (
          <div className="absolute top-16 right-4 z-50 flex items-center gap-2 bg-neutral-800/95 text-white border border-white/15 px-3 py-1.5 rounded-full text-xs shadow-xl animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span>{shareFeedback}</span>
          </div>
        )}
      </header>

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <div 
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowPlaylistModal(false)}
        >
          <div 
            className="w-full sm:max-w-md bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 text-white max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ListPlus className="w-5 h-5 text-white" />
                <span>Add to Playlist</span>
              </h3>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create New Playlist Inline */}
            <div className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New playlist name..."
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPlaylistTitle.trim() && currentTrack) {
                      const newPl = createPlaylist(newPlaylistTitle.trim());
                      addTrackToPlaylist(newPl.id, currentTrack.id);
                      setNewPlaylistTitle('');
                      setShowPlaylistModal(false);
                      setShareFeedback(`Added to ${newPl.title}!`);
                      setTimeout(() => setShareFeedback(null), 2500);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-black/60 border border-white/15 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
                <button
                  onClick={() => {
                    if (!newPlaylistTitle.trim() || !currentTrack) return;
                    const newPl = createPlaylist(newPlaylistTitle.trim());
                    addTrackToPlaylist(newPl.id, currentTrack.id);
                    setNewPlaylistTitle('');
                    setShowPlaylistModal(false);
                    setShareFeedback(`Added to ${newPl.title}!`);
                    setTimeout(() => setShareFeedback(null), 2500);
                  }}
                  disabled={!newPlaylistTitle.trim()}
                  className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-xl disabled:opacity-40 hover:bg-neutral-200 transition-colors shrink-0"
                >
                  Create
                </button>
              </div>
            </div>

            {/* User Playlists List */}
            <div className="overflow-y-auto flex-1 space-y-1.5 py-2 max-h-60 no-scrollbar">
              {(playlists || []).filter(
                (p) =>
                  p &&
                  p.id &&
                  !p.id.startsWith('pl-trending') &&
                  !p.id.startsWith('pl-chillhop') &&
                  !p.id.startsWith('pl-cyberwave') &&
                  !p.id.startsWith('pl-sunset')
              ).length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">
                  No playlists yet. Enter a name above to create your first playlist!
                </p>
              ) : (
                (playlists || [])
                  .filter(
                    (p) =>
                      p &&
                      p.id &&
                      !p.id.startsWith('pl-trending') &&
                      !p.id.startsWith('pl-chillhop') &&
                      !p.id.startsWith('pl-cyberwave') &&
                      !p.id.startsWith('pl-sunset')
                  )
                  .map((pl) => {
                    const alreadyIn = currentTrack && pl.trackIds?.includes(currentTrack.id);
                    return (
                      <button
                        key={pl.id}
                        onClick={() => {
                          if (!currentTrack) return;
                          addTrackToPlaylist(pl.id, currentTrack.id);
                          setShowPlaylistModal(false);
                          setShareFeedback(`Added to ${pl.title}!`);
                          setTimeout(() => setShareFeedback(null), 2500);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <ListMusic className="w-4 h-4 text-white" />
                          </div>
                          <div className="truncate">
                            <div className="text-sm font-medium text-white truncate">{pl.title}</div>
                            <div className="text-xs text-neutral-400">
                              {(pl.trackIds || []).length} songs
                            </div>
                          </div>
                        </div>
                        {alreadyIn && (
                          <span className="text-xs text-green-400 font-medium shrink-0 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Added
                          </span>
                        )}
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Screen Content Frame */}
      <div className="relative z-10 w-full max-w-md mx-auto h-full flex flex-col justify-end px-6 pb-6 pt-20">

        {/* 2. Album Art */}
        <div className="w-full my-auto py-4 flex items-center justify-center">
          <div 
            id="player-screen-cover-box"
            className="w-full max-w-[340px] aspect-square rounded-[32px] overflow-hidden bg-neutral-800/40 shadow-2xl border border-white/10 relative flex items-center justify-center"
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Cover Art"
                className="w-full h-full object-cover rounded-[32px]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <AppLogo className="w-24 h-24 text-white/50" />
            )}
          </div>
        </div>

        {/* Bottom Controls Group */}
        <div className="w-full space-y-6">
          {/* 3. Song Info & Favorite Button */}
          <div className="flex items-center justify-between w-full gap-4">
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="w-full overflow-hidden whitespace-nowrap">
                <h1 
                  ref={titleRef}
                  className={`text-xl font-bold text-white leading-tight inline-block ${isMarquee ? 'animate-marquee' : 'truncate w-full'}`}
                >
                  {title}
                </h1>
              </div>
              <p className="text-base text-neutral-400 truncate mt-1">
                {artist}
              </p>

            </div>
            <button
              id="player-screen-favorite-btn"
              onClick={handleToggleLike}
              aria-label="Favorite"
              className="p-2 -mr-2 transition-transform active:scale-110 shrink-0"
            >
              <Heart 
                className={`w-8 h-8 transition-colors ${
                  isLiked 
                    ? 'fill-white text-white' 
                    : 'text-white hover:text-neutral-300'
                }`} 
              />
            </button>
          </div>

          {/* 4. Progress Bar */}
          <div className="w-full space-y-2">
            <div className="relative w-full flex items-center">
              <input
                id="player-screen-slider"
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={sliderProgress}
                onChange={handleSliderChange}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                aria-label="Playback progress"
                className="w-full h-1.5 bg-neutral-700/60 rounded-full appearance-none cursor-pointer accent-white hover:accent-white focus:outline-none transition-all"
                style={{
                  background: `linear-gradient(to right, #ffffff ${sliderProgress * 100}%, rgba(120, 120, 120, 0.4) ${sliderProgress * 100}%)`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
              <span>{formatDurationMs(currentPos)}</span>
              <span>{formatDurationMs(totalDuration)}</span>
            </div>
          </div>

          {/* 5. Action Controls Row */}
          <div className="flex items-center justify-between w-full px-2 pt-2 pb-6">
            {/* Shuffle Button */}
            <button
              id="player-screen-shuffle-btn"
              onClick={() => {
                toggleShuffle();
                setIsShuffle(!isShuffle);
              }}
              aria-label="Shuffle"
              className="p-2 text-white hover:opacity-80 active:scale-95 transition-transform"
            >
              <Shuffle 
                className={`w-7 h-7 transition-colors ${
                  isShuffle ? 'text-white' : 'text-neutral-400'
                }`} 
              />
            </button>

            {/* Skip Previous */}
            <button
              id="player-screen-prev-btn"
              onClick={handlePrevious}
              aria-label="Previous"
              className="p-2 text-white hover:opacity-80 active:scale-95 transition-transform"
            >
              <SkipBack className="w-10 h-10 text-white fill-white/10" />
            </button>

            {/* Play / Pause (72dp White Circle) */}
            <button
              id="player-screen-play-pause-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-[72px] h-[72px] rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-all hover:bg-neutral-100"
            >
              {isPlaying ? (
                <Pause className="w-9 h-9 fill-current text-black" />
              ) : (
                <Play className="w-10 h-10 fill-current text-black translate-x-0.5" />
              )}
            </button>

            {/* Skip Next */}
            <button
              id="player-screen-next-btn"
              onClick={nextTrack}
              aria-label="Next"
              className="p-2 text-white hover:opacity-80 active:scale-95 transition-transform"
            >
              <SkipForward className="w-10 h-10 text-white fill-white/10" />
            </button>

            {/* Repeat Mode Cycle Button */}
            <button
              id="player-screen-repeat-btn"
              onClick={cycleRepeat}
              aria-label="Repeat"
              className="p-2 text-white hover:opacity-80 active:scale-95 transition-transform"
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-7 h-7 text-white" />
              ) : (
                <Repeat 
                  className={`w-7 h-7 transition-colors ${
                    repeatMode !== 'off' ? 'text-white' : 'text-neutral-400'
                  }`} 
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
