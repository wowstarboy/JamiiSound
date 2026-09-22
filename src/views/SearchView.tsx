import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { getCachedMusicData } from '../services/firestoreMusicService';
import { collectionGroup, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Track } from '../types';

export const SearchView: React.FC = () => {
  const { setCurrentTab, playTrack, navigateToArtist, navigateToAlbum, currentTrack, isLoadingFirestore } = useMusic();
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Trending', 'Artist', 'Songs', 'Album', 'EP'];

  const [searchQuery, setSearchQuery] = useState('');
  
  // Realtime trending songs placeholder
  const [trendingSongs, setTrendingSongs] = useState<Track[]>([]);
  const cachedData = getCachedMusicData();
  const isTrendingLoading = (isLoadingFirestore && trendingSongs.length === 0) || (!cachedData && trendingSongs.length === 0);
  
  useEffect(() => {
    let isMounted = true;
    const q = query(collectionGroup(db, 'songs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isMounted) return;
      if (!cachedData) return;
      
      const rawTrending = [...cachedData.trendingSongs].sort((a, b) => {
        const aPlays = snapshot.docs.find(d => d.id === a.id)?.data()?.streamCount || a.plays || 0;
        const bPlays = snapshot.docs.find(d => d.id === b.id)?.data()?.streamCount || b.plays || 0;
        return Number(bPlays) - Number(aPlays);
      });
      setTrendingSongs(rawTrending.slice(0, 5));
    }, (error) => console.warn("Real-time Trending error:", error));
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [cachedData]);

  useEffect(() => {
    if (cachedData && trendingSongs.length === 0) {
      setTrendingSongs(cachedData.trendingSongs.slice(0, 5));
    }
  }, [cachedData]);

  // Search logic
  const allResults = useMemo(() => {
    if (!cachedData || !searchQuery.trim()) return { artists: [], albums: [], songs: [], eps: [], trending: [] };
    
    const queryLower = searchQuery.toLowerCase();
    const artists = cachedData.artists.filter(a => a.artistName?.toLowerCase().includes(queryLower));
    const albums = cachedData.albumsOnly.filter(a => a.albumTitle?.toLowerCase().includes(queryLower) || a.artistName?.toLowerCase().includes(queryLower));
    const eps = cachedData.epsAndSingles.filter(a => a.albumTitle?.toLowerCase().includes(queryLower) || a.artistName?.toLowerCase().includes(queryLower));
    const songs = cachedData.tracks.filter(t => t.title?.toLowerCase().includes(queryLower) || t.artist?.toLowerCase().includes(queryLower));
    const trending = cachedData.trendingSongs.filter(t => t.title?.toLowerCase().includes(queryLower) || t.artist?.toLowerCase().includes(queryLower));

    return { artists, albums, songs, eps, trending };
  }, [cachedData, searchQuery]);

  const results = useMemo(() => {
    let items: any[] = [];
    if (!searchQuery.trim()) return items;

    if (activeTab === 'All') {
      items = [
        ...allResults.artists.map(a => ({ ...a, resultType: 'artist' })),
        ...allResults.songs.map(s => ({ ...s, resultType: 'song' })),
        ...allResults.albums.map(a => ({ ...a, resultType: 'album' })),
        ...allResults.eps.map(e => ({ ...e, resultType: 'ep' }))
      ];
    } else if (activeTab === 'Trending') {
      items = allResults.trending.map(s => ({ ...s, resultType: 'song' }));
    } else if (activeTab === 'Artist') {
      items = allResults.artists.map(a => ({ ...a, resultType: 'artist' }));
    } else if (activeTab === 'Songs') {
      items = allResults.songs.map(s => ({ ...s, resultType: 'song' }));
    } else if (activeTab === 'Album') {
      items = allResults.albums.map(a => ({ ...a, resultType: 'album' }));
    } else if (activeTab === 'EP') {
      items = allResults.eps.map(e => ({ ...e, resultType: 'ep' }));
    }
    return items;
  }, [allResults, activeTab, searchQuery]);

  // Infinite Scroll Pagination
  const [limit, setLimit] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLimit(20);
  }, [searchQuery, activeTab]);

  const setupAutoScrollObserver = useCallback((
    sentinel: HTMLDivElement | null,
    onLoadMore: () => void,
    hasMore: boolean
  ) => {
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hasMore = limit < results.length;
    return setupAutoScrollObserver(
      sentinelRef.current,
      () => setLimit((prev) => prev + 20),
      hasMore
    );
  }, [results, limit, setupAutoScrollObserver]);

  const renderItem = (item: any) => {
    if (item.resultType === 'artist') {
      return (
        <div
          key={`artist-${item.artistId}`}
          className="flex items-center gap-4 py-2 cursor-pointer group"
          onClick={() => navigateToArtist(item.artistId)}
        >
          <img src={item.profilePicture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'} className="w-12 h-12 rounded-full object-cover shrink-0 bg-neutral-900" />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{item.artistName}</h3>
            <p className="text-white/50 text-xs truncate">Artist</p>
          </div>
        </div>
      );
    }
    if (item.resultType === 'album' || item.resultType === 'ep') {
      return (
        <div
          key={`album-${item.albumId}`}
          className="flex items-center gap-4 py-2 cursor-pointer group"
          onClick={() => navigateToAlbum(item.albumId)}
        >
          <img src={item.coverArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'} className="w-12 h-12 rounded-md object-cover shrink-0 bg-neutral-900" />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{item.albumTitle}</h3>
            <p className="text-white/50 text-xs truncate">{item.artistName} • {item.type || 'Album'}</p>
          </div>
        </div>
      );
    }
    if (item.resultType === 'song') {
      const isCurrent = currentTrack?.id === item.id;
      return (
        <div
          key={`song-${item.id}`}
          className="flex items-center gap-4 py-2 cursor-pointer group"
          onClick={() => playTrack(item, [item])}
        >
          <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-neutral-900">
            <img src={item.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-current" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium truncate ${isCurrent ? 'text-white font-bold' : 'text-white'}`}>{item.title}</h3>
            <p className="text-white/50 text-xs truncate">{item.artist}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-black flex flex-col pb-28 md:pb-24">
      {/* Search Header */}
      <header className="sticky top-0 z-30 w-full bg-gradient-to-b from-white via-white/80 to-transparent dark:from-[#000000] dark:via-[#000000]/80 dark:to-transparent pt-3.5 pb-2 select-none">
        <div className="flex items-center gap-3 px-4 md:px-8 mb-4">
          <button
            onClick={() => setCurrentTab('home')}
            className="w-12 h-12 flex items-center justify-center text-white bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-neutral-800 text-white placeholder-neutral-400 rounded-full px-5 outline-none focus:bg-neutral-700 transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full px-4 md:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Results / Placeholder */}
      {!searchQuery.trim() ? (
        <div className="px-4 md:px-8 mt-4">
          <h2 className="text-lg font-bold text-white mb-4">Trending Songs</h2>
          {isTrendingLoading ? (
            <div className="flex flex-col space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`trending-sk-${i}`} className="flex items-center gap-4 py-2">
                  <div className="w-12 h-12 rounded-md bg-neutral-800/80 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-3/5 bg-neutral-800/80 rounded" />
                    <div className="h-3 w-2/5 bg-neutral-800/50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {trendingSongs.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 py-2 cursor-pointer group"
                    onClick={() => playTrack(track, trendingSongs)}
                  >
                    <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-neutral-900">
                      <img src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${isCurrent ? 'text-white font-bold' : 'text-white'}`}>{track.title}</h3>
                      <p className="text-white/50 text-xs truncate">{track.artist}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 md:px-8 mt-4 flex flex-col">
          {results.length === 0 ? (
            <div className="py-12 text-center text-white/50">No results found for "{searchQuery}"</div>
          ) : (
            <>
              {results.slice(0, limit).map(renderItem)}
              {limit < results.length && (
                <div ref={sentinelRef} className="w-full py-8 flex justify-center opacity-60">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
