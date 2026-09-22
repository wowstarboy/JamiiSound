import React, { useEffect, useState } from 'react';
import { Play, ArrowLeft, Search, ListMusic, Share2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AppLogo } from '../components/AppLogo';

interface UserProfileData {
  displayName?: string;
  email?: string;
  role?: string;
}

export const FavoritesView: React.FC = () => {
  const { setCurrentTab, goBack, playlists, currentUser, navigateToPlaylist, playTrack, tracks } = useMusic();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [visiblePlaylistsLimit, setVisiblePlaylistsLimit] = useState(5);

  useEffect(() => {
    let isMounted = true;
    const fetchUserData = async () => {
      if (!currentUser?.uid) return;
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists() && isMounted) {
          setProfileData(userSnap.data() as UserProfileData);
        }
      } catch (err) {
        console.warn('Error loading user profile:', err);
      }
    };
    fetchUserData();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleBack = () => {
    goBack();
  };

  const displayName = profileData?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User Profile';
  const roleLabel = profileData?.role ? profileData.role.toUpperCase() : 'LISTENER';

  // Filter out dummy playlists
  const userPlaylists = (playlists || []).filter(
    (p) =>
      p &&
      p.id &&
      !p.id.startsWith('pl-trending') &&
      !p.id.startsWith('pl-chillhop') &&
      !p.id.startsWith('pl-cyberwave') &&
      !p.id.startsWith('pl-sunset')
  );

  const paginatedPlaylists = userPlaylists.slice(0, visiblePlaylistsLimit);

  const handleShareProfile = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `${displayName} on JamiiSound`,
      text: `Check out ${displayName}'s profile on JamiiSound!`,
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
      console.warn('Share error:', err);
    }
  };

  const handlePlayAll = () => {
    if (userPlaylists.length > 0) {
      const allTrackIds = Array.from(new Set(userPlaylists.flatMap((p) => p.trackIds || [])));
      const playlistTracks = tracks.filter((t) => allTrackIds.includes(t.id));
      if (playlistTracks.length > 0) {
        playTrack(playlistTracks[0], playlistTracks);
      }
    }
  };

  return (
    <div id="favorites-view-container" className="h-full overflow-y-auto no-scrollbar text-white bg-black pb-28 md:pb-24 select-none">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-white/5">
        <button
          onClick={handleBack}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center text-white bg-transparent hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-white text-lg drop-shadow-md truncate px-4">
          Profile
        </span>
        <button
          onClick={() => setCurrentTab('search')}
          aria-label="Search"
          className="w-10 h-10 flex items-center justify-center text-white bg-transparent hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <Search className="w-6 h-6" />
        </button>
      </header>

      {/* Profile Info Section (Avatar moved on top directly under header) */}
      <div className="relative w-full flex flex-col pt-6 pb-6 px-4 md:px-8 z-10 space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8">
          {/* Avatar on top with black background & App Logo */}
          <div className="shrink-0 relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-2xl bg-black border-2 border-white/20 flex items-center justify-center pointer-events-auto transition-transform hover:scale-105">
              <AppLogo className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
            </div>
          </div>
          
          {/* Profile Details */}
          <div className="flex flex-col gap-2.5 w-full text-center sm:text-left">
            <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
              {roleLabel}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-3">
              {displayName}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-neutral-400 mt-1">
              <span>{userPlaylists.length} Playlists</span>
            </div>

            {/* Action Buttons: Play All + Working Share Button */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
              {userPlaylists.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  className="px-7 py-2.5 rounded-full bg-white text-black font-bold text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  <span>Play All</span>
                </button>
              )}

              {/* Working Share Button */}
              <button
                id="profile-share-btn"
                onClick={handleShareProfile}
                className="px-5 py-2.5 rounded-full border border-white/20 hover:border-white text-white font-semibold text-sm flex items-center gap-2 transition-all relative"
                title="Share Profile"
                aria-label="Share Profile"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span>Share</span>
                {shareFeedback && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-[11px] px-2.5 py-1 rounded shadow-lg border border-white/20 z-50">
                    {shareFeedback}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Playlists Section */}
        <section className="w-full bg-transparent px-2 sm:px-0 pt-4">
          <div className="flex items-center justify-between mb-5 px-2 border-b border-white/5 pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-white" />
              <span>Your Playlists</span>
            </h2>
          </div>
          
          {userPlaylists.length === 0 ? (
            /* Skeleton Placeholder when there are no playlists */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={`skeleton-${item}`} className="flex flex-col gap-3 animate-pulse">
                  <div className="w-full aspect-square rounded-xl bg-neutral-900 border border-white/5 shadow-inner" />
                  <div className="w-3/4 h-3.5 bg-neutral-900 rounded" />
                  <div className="w-1/2 h-2.5 bg-neutral-900 rounded mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2">
                {paginatedPlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => navigateToPlaylist(playlist.id)}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 relative shadow-lg border border-white/5 group-hover:border-white/20 transition-colors bg-black flex items-center justify-center">
                      <ListMusic className="w-12 h-12 text-white/40 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-sm text-white truncate group-hover:underline">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">
                      {(playlist.trackIds || []).length} {(playlist.trackIds || []).length === 1 ? 'Song' : 'Songs'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination (Show More) matching Artist view songs */}
              {userPlaylists.length > visiblePlaylistsLimit && (
                <div className="pt-8 flex justify-center">
                  <button
                    onClick={() => setVisiblePlaylistsLimit((prev) => prev + 5)}
                    className="px-6 py-2.5 rounded-full border border-white/20 text-xs font-semibold text-white hover:border-white transition-colors"
                  >
                    Show More
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
