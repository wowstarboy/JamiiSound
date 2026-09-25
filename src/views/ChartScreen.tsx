import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { StructuredHomeData, getCachedMusicData } from '../services/firestoreMusicService';
import { collection, query, onSnapshot, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Artist as FirestoreArtist } from '../types/collections';

export const ChartScreen: React.FC = () => {
  const { setCurrentTab, navigateToArtist } = useMusic();
  const [topArtists, setTopArtists] = useState<FirestoreArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topArtistsLimit, setTopArtistsLimit] = useState(20);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Setup infinite scroll observer
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
      { root: null, rootMargin: '200px', threshold: 0.1 } // use viewport as root for vertical scroll
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Fetch artists ordered by monthlyListeners for a more efficient Charts page
    const artistsQuery = query(
      collection(db, 'artists'),
      orderBy('monthlyListeners', 'desc'),
      firestoreLimit(topArtistsLimit)
    );

    const unsubscribe = onSnapshot(artistsQuery, (snapshot) => {
      if (!isMounted) return;
      const artists: FirestoreArtist[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Partial<FirestoreArtist>;
        artists.push({
          artistId: data.artistId || doc.id,
          artistName: data.artistName || 'Unknown Artist',
          profilePicture: data.profilePicture || '',
          followersCount: Number(data.followersCount) || 0,
          monthlyListeners: Number(data.monthlyListeners) || 0,
          bio: data.bio || '',
          followingCount: Number(data.followingCount) || 0,
          isVerified: !!data.isVerified,
          isClaimed: !!data.isClaimed,
          claimedByUid: data.claimedByUid || null,
          youtubeUrl: data.youtubeUrl || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      setTopArtists(artists);
      setIsLoading(false);
    }, (error) => {
      console.warn("Error fetching Top Artists in Charts:", error);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [topArtistsLimit]);

  useEffect(() => {
    const hasMore = topArtists.length >= topArtistsLimit;
    return setupAutoScrollObserver(
      containerRef.current,
      sentinelRef.current,
      () => setTopArtistsLimit((prev) => prev + 20),
      hasMore
    );
  }, [topArtists.length, topArtistsLimit, setupAutoScrollObserver]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 bg-transparent flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 w-full bg-gradient-to-b from-white via-white/80 to-transparent dark:from-[#000000] dark:via-[#000000]/80 dark:to-transparent flex items-center justify-between px-4 md:px-8 py-3.5 mb-6 select-none">
        <button
          onClick={() => setCurrentTab('home')}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center text-neutral-900 dark:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-neutral-900 dark:text-white text-lg drop-shadow-md truncate px-4">
          Charts
        </h1>
        <button
          onClick={() => setCurrentTab('search')}
          aria-label="Search"
          className="w-10 h-10 flex items-center justify-center text-neutral-900 dark:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <Search className="w-6 h-6" />
        </button>
      </header>

      {/* Grid Content */}
      <div className="px-4 md:px-8" ref={containerRef}>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-3"></div>
                <div className="w-24 h-4 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {topArtists.map((artist, idx) => (
              <div
                key={artist.artistId}
                className="flex flex-col items-center text-center cursor-pointer group"
                onClick={() => navigateToArtist(artist.artistId)}
              >
                <div className="relative mb-3">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-xl border-2 border-neutral-200 dark:border-neutral-800 group-hover:border-black dark:group-hover:border-white transition-colors bg-neutral-100 dark:bg-neutral-900">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={artist.profilePicture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
                      alt={artist.artistName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center shadow-md border-[2.5px] border-black z-10">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-slate-100 truncate group-hover:text-black dark:group-hover:text-white w-full">
                  {artist.artistName}
                </h3>
              </div>
            ))}
          </div>
        )}
        
        {/* Infinite scroll sentinel */}
        {topArtists.length >= topArtistsLimit && !isLoading && (
          <div ref={sentinelRef} className="w-full py-8 flex justify-center opacity-60">
            <div className="w-6 h-6 border-2 border-neutral-900/20 border-t-neutral-900 dark:border-white/20 dark:border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};
