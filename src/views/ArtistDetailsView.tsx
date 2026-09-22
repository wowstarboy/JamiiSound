import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Check, Heart, Disc, Sparkles, Youtube, Users, Radio, ArrowLeft, Search, BadgeCheck, ChevronDown, TrendingUp, Share2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { TrackRow } from '../components/TrackRow';
import { formatNumber } from '../utils/formatters';
import { subscribeArtistFollow, toggleArtistFollow, getEffectiveUserId } from '../services/followManager';
import { fetchArtistFullDataLazy } from '../services/firestoreMusicService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Artist as FirestoreArtist, Album as FirestoreAlbum } from '../types/collections';
import { Track } from '../types';

export const ArtistDetailsView: React.FC = () => {
  const { 
    activeArtistId, 
    playTrack, 
    navigateToAlbum, 
    navigateToArtist,
    getArtistById,
    getTracksByArtistId,
    getAlbumsByArtistId,
    setCurrentTab,
    firestoreArtists
  } = useMusic();

  const [artist, setArtist] = useState<FirestoreArtist | null>(() => {
    return activeArtistId ? getArtistById(activeArtistId) || null : null;
  });
  const [artistTracks, setArtistTracks] = useState<Track[]>(() => {
    return activeArtistId ? getTracksByArtistId(activeArtistId) : [];
  });
  const [artistAlbums, setArtistAlbums] = useState<FirestoreAlbum[]>(() => {
    return activeArtistId ? getAlbumsByArtistId(activeArtistId) : [];
  });
  const [isLoadingArtist, setIsLoadingArtist] = useState<boolean>(true);
  const [popularArtistsList, setPopularArtistsList] = useState<FirestoreArtist[]>([]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [realtimeFollowers, setRealtimeFollowers] = useState<number | null>(null);
  const [realtimeListeners, setRealtimeListeners] = useState<number | null>(null);
  const [visibleTracksLimit, setVisibleTracksLimit] = useState(5);
  const [visibleAlbumsLimit, setVisibleAlbumsLimit] = useState(4);
  const [visibleSinglesLimit, setVisibleSinglesLimit] = useState(4);
  const [popularArtistsLimit, setPopularArtistsLimit] = useState(10);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const popularArtistsContainerRef = useRef<HTMLDivElement>(null);
  const popularArtistsSentinelRef = useRef<HTMLDivElement>(null);

  // Lazy fetch data ONLY for the active artist being viewed
  useEffect(() => {
    if (!activeArtistId) {
      setArtist(null);
      setArtistTracks([]);
      setArtistAlbums([]);
      setIsLoadingArtist(false);
      return;
    }

    let isMounted = true;
    setIsLoadingArtist(true);

    fetchArtistFullDataLazy(activeArtistId)
      .then((data) => {
        if (!isMounted) return;
        if (data.artist) {
          setArtist(data.artist);
        } else {
          const fallback = getArtistById(activeArtistId);
          if (fallback) setArtist(fallback);
        }
        setArtistTracks(data.tracks);
        setArtistAlbums(data.albums);
        setIsLoadingArtist(false);
      })
      .catch((err) => {
        console.warn('Error lazy loading artist details:', err);
        if (isMounted) setIsLoadingArtist(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeArtistId]);

  // Load artists list for the bottom recommended rail if needed
  useEffect(() => {
    if (firestoreArtists.length > 0) {
      setPopularArtistsList(firestoreArtists);
    } else {
      getDocs(collection(db, 'artists')).then((snap) => {
        const list: FirestoreArtist[] = [];
        snap.forEach(d => {
          const a = d.data() as Partial<FirestoreArtist>;
          list.push({
            artistId: a.artistId || d.id,
            artistName: a.artistName || d.id,
            profilePicture: a.profilePicture || '',
            followersCount: Number(a.followersCount) || 0,
            monthlyListeners: Number(a.monthlyListeners) || 0,
            bio: a.bio || '',
            followingCount: Number(a.followingCount) || 0,
            isVerified: !!a.isVerified,
            isClaimed: !!a.isClaimed,
            claimedByUid: a.claimedByUid || null,
            youtubeUrl: a.youtubeUrl || '',
            createdAt: a.createdAt || new Date().toISOString(),
          });
        });
        setPopularArtistsList(list);
      }).catch(err => console.warn('Error fetching popular artists:', err));
    }
  }, [firestoreArtists]);

  const popularArtists = (popularArtistsList.length > 0 ? popularArtistsList : firestoreArtists)
    .filter(a => a.artistId !== activeArtistId)
    .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));

  const setupAutoScrollObserver = useCallback((
    container: HTMLDivElement | null,
    sentinel: HTMLDivElement | null,
    onLoadMore: () => void,
    hasMore: boolean
  ) => {
    if (!container || !sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: container, rootMargin: '120px', threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return setupAutoScrollObserver(
      popularArtistsContainerRef.current,
      popularArtistsSentinelRef.current,
      () => setPopularArtistsLimit((prev) => prev + 10),
      popularArtistsLimit < popularArtists.length
    );
  }, [popularArtists.length, popularArtistsLimit, setupAutoScrollObserver]);

  // Scroll to top when activeArtistId changes
  useEffect(() => {
    const container = document.getElementById('artist-view-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeArtistId]);

  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>,
    onLoadMore: () => void,
    hasMore: boolean
  ) => {
    if (!hasMore) return;
    const el = e.currentTarget;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 150) {
      onLoadMore();
    }
  };

  // Real-time followers and listeners tracking via followManager
  useEffect(() => {
    if (!activeArtistId) return;
    const userId = getEffectiveUserId();
    const unsub = subscribeArtistFollow(activeArtistId, userId, (stats) => {
      setIsFollowing(stats.isFollowing);
      setRealtimeFollowers(stats.followersCount);
      setRealtimeListeners(stats.monthlyListeners);
    });
    return () => unsub();
  }, [activeArtistId]);

  const isCurrentArtistLoaded = artist && (
    artist.artistId === activeArtistId ||
    artist.artistId.toLowerCase() === activeArtistId?.toLowerCase() ||
    `@${artist.artistId.toLowerCase()}` === activeArtistId?.toLowerCase() ||
    artist.artistId.toLowerCase() === `@${activeArtistId?.toLowerCase()}` ||
    artist.artistName.toLowerCase() === activeArtistId?.toLowerCase()
  );

  if (isLoadingArtist || !artist || !isCurrentArtistLoaded) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const currentFollowersCount = realtimeFollowers !== null ? realtimeFollowers : (artist.followersCount || 0);
  const currentMonthlyListeners = realtimeListeners !== null ? realtimeListeners : (artist.monthlyListeners || 0);

  const handleToggleFollow = async () => {
    if (!activeArtistId) return;
    const userId = getEffectiveUserId();
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setRealtimeFollowers((prev) => Math.max(0, (prev !== null ? prev : currentFollowersCount) + (nextFollowing ? 1 : -1)));
    await toggleArtistFollow(activeArtistId, userId, isFollowing);
  };

  const handlePlayArtist = () => {
    if (artistTracks.length > 0) {
      playTrack(artistTracks[0], artistTracks);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setCurrentTab('home');
    }
  };

  const handleShareArtist = async () => {
    if (!artist && !activeArtistId) return;
    const artistName = artist?.artistName || 'Artist';
    const shareUrl = `${window.location.origin}/artist/${activeArtistId}`;

    const shareData = {
      title: `${artistName} on JamiiSound`,
      text: `Listen to ${artistName} on JamiiSound!`,
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

  const albumsList = artistAlbums.filter((a) => a.type === 'ALBUM');
  const epsAndSingles = artistAlbums.filter((a) => a.type === 'EP' || a.type === 'SINGLE');

  return (
    <div id="artist-view-container" className="fixed inset-0 z-50 w-full h-[100dvh] overflow-y-auto overscroll-none text-white bg-black pb-28">
      {/* Full Width Hero Banner */}
      <div className="absolute top-0 inset-x-0 h-[60vh] min-h-[400px] pointer-events-none overflow-hidden z-0">
        <img
          src={artist.profilePicture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
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
          {artist.artistName}
        </span>
        <button
          onClick={() => setCurrentTab('search')}
          aria-label="Search"
          className="w-10 h-10 flex items-center justify-center text-white bg-transparent hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <Search className="w-6 h-6" />
        </button>
      </header>

      {/* Artist Info Section */}
      <div className="relative w-full flex flex-col pt-[25vh] pb-6 px-4 sm:px-8 z-10 space-y-12">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Hero Content */}
          <div className="flex flex-col gap-3 w-full text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg flex items-center justify-center sm:justify-start gap-3">
              {artist.artistName}
              {artist.isVerified && (
                <BadgeCheck className="w-8 h-8 text-black fill-white" />
              )}
            </h1>

            {/* Bio above buttons */}
            {artist.bio && (
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl whitespace-pre-line mt-2">
                {artist.bio}
              </p>
            )}
            
            {/* Monthly Listeners matching bio font */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-slate-300">
              <span>{formatNumber(currentMonthlyListeners)} monthly listeners</span>
              <span>•</span>
              <span>{formatNumber(currentFollowersCount)} followers</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-4">
              {artistTracks.length > 0 && (
                <button
                  onClick={handlePlayArtist}
                  className="px-7 py-3 rounded-full bg-white text-black font-bold text-sm flex items-center gap-2.5 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  <span>Play</span>
                </button>
              )}

              <button
                id="artist-follow-btn"
                onClick={handleToggleFollow}
                className={`px-7 py-3 rounded-full text-sm font-bold border transition-all ${
                  isFollowing 
                    ? 'border-white bg-white text-black' 
                    : 'border-white/20 bg-transparent text-white hover:border-white'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              <button
                id="artist-share-btn"
                onClick={handleShareArtist}
                className="p-3 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 text-white transition-all relative"
                title="Share Artist"
                aria-label="Share Artist"
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

        {/* Popular Tracks */}
        <section className="w-full bg-transparent px-0">
          <h2 className="text-xl font-bold text-white mb-4 px-4 sm:px-8">Popular Tracks</h2>
          {artistTracks.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">
              No tracks found for this artist yet.
            </div>
          ) : (
            <div className="w-full divide-y divide-white/5">
              {artistTracks.slice(0, visibleTracksLimit).map((track, idx) => (
                <div key={track.id} className="px-1 sm:px-4">
                  <TrackRow
                    track={track}
                    index={idx}
                    contextQueue={artistTracks}
                  />
                </div>
              ))}
              {visibleTracksLimit < artistTracks.length && (
                <div className="pt-4 px-4 sm:px-8">
                  <button 
                    onClick={() => setVisibleTracksLimit(prev => prev + 5)}
                    className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
                  >
                    See more
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Albums */}
        {albumsList.length > 0 && (
          <section className="w-full bg-transparent px-2 sm:px-0">
            <h2 className="text-xl font-bold text-white mb-4 px-2">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2">
              {albumsList.slice(0, visibleAlbumsLimit).map((album) => (
                <div
                  key={album.albumId}
                  className="group cursor-pointer flex flex-col"
                  onClick={() => navigateToAlbum(album.albumId)}
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 relative shadow-lg border border-white/5 group-hover:border-white/20 transition-colors bg-neutral-900">
                    <img
                      src={album.coverArt || artist.profilePicture}
                      alt={album.albumTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100 truncate group-hover:text-white">
                    {album.albumTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {album.tracksCount} {album.tracksCount === 1 ? 'Song' : 'Songs'}
                  </p>
                </div>
              ))}
            </div>
            {visibleAlbumsLimit < albumsList.length && (
              <div className="pt-8 pb-4 px-2 flex flex-col items-center justify-center">
                <button 
                  onClick={() => setVisibleAlbumsLimit(prev => prev + 4)}
                  className="flex flex-col items-center gap-1 text-sm font-semibold text-white/70 hover:text-white transition-colors"
                >
                  <span>See more</span>
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* EPs & Singles */}
        {epsAndSingles.length > 0 && (
          <section className="w-full bg-transparent px-2 sm:px-0">
            <h2 className="text-xl font-bold text-white mb-4 px-2">EPs & Singles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2">
              {epsAndSingles.slice(0, visibleSinglesLimit).map((album) => (
                <div
                  key={album.albumId}
                  className="group cursor-pointer flex flex-col"
                  onClick={() => navigateToAlbum(album.albumId)}
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 relative shadow-lg border border-white/5 group-hover:border-white/20 transition-colors bg-neutral-900">
                    <img
                      src={album.coverArt || artist.profilePicture}
                      alt={album.albumTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100 truncate group-hover:text-white">
                    {album.albumTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 uppercase truncate">
                    {album.type} • {album.tracksCount} {album.tracksCount === 1 ? 'Song' : 'Songs'}
                  </p>
                </div>
              ))}
            </div>
            {visibleSinglesLimit < epsAndSingles.length && (
              <div className="pt-8 pb-4 px-2 flex flex-col items-center justify-center">
                <button 
                  onClick={() => setVisibleSinglesLimit(prev => prev + 4)}
                  className="flex flex-col items-center gap-1 text-sm font-semibold text-white/70 hover:text-white transition-colors"
                >
                  <span>See more</span>
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Popular Artists */}
        {popularArtists.length > 0 && (
          <section className="w-full bg-transparent px-2 sm:px-0 mt-8">
            <h2 className="text-xl font-bold text-white mb-4 px-2">Popular Artists</h2>
            <div 
              ref={popularArtistsContainerRef}
              className="flex gap-6 overflow-x-auto no-scrollbar pb-3 pt-1 snap-x scroll-smooth px-2"
              onScroll={(e) => handleScroll(e, () => setPopularArtistsLimit(p => p + 10), popularArtistsLimit < popularArtists.length)}
            >
              {popularArtists.slice(0, popularArtistsLimit).map((artist, idx) => (
                <div
                  key={artist.artistId}
                  className="shrink-0 snap-start flex flex-col items-center text-center cursor-pointer group w-36 sm:w-44 bg-transparent p-0 border-0"
                  onClick={() => navigateToArtist(artist.artistId)}
                >
                  <div className="relative mb-3">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-xl border-2 border-neutral-800 group-hover:border-white transition-colors bg-neutral-900">
                      <img loading="lazy" decoding="async"
                        src={artist.profilePicture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
                        alt={artist.artistName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <h3 className="font-semibold text-base text-slate-100 truncate group-hover:text-white w-full">
                    {artist.artistName}
                  </h3>
                </div>
              ))}
              {popularArtistsLimit < popularArtists.length && (
                <div ref={popularArtistsSentinelRef} className="snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
