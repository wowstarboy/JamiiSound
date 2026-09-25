import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, TrendingUp, Search, Flame, Disc3, Radio, ChevronRight } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { fetchFullMusicData, StructuredHomeData } from '../services/firestoreMusicService';
import { collectionGroup, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PopularArtistSlider } from '../components/PopularArtistSlider';

export const HomeView: React.FC = () => {
  const { 
    playTrack, 
    navigateToArtist, 
    navigateToAlbum, 
    setCurrentTab,
    activeAlbumId,
    activeArtistId,
    firestoreArtists
  } = useMusic();

  const [data, setData] = useState<StructuredHomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [trendingLimit, setTrendingLimit] = useState(10);
  const [topArtistsLimit, setTopArtistsLimit] = useState(10);
  const [albumsLimit, setAlbumsLimit] = useState(10);
  const [singlesLimit, setSinglesLimit] = useState(10);

  const trendingContainerRef = useRef<HTMLDivElement>(null);
  const trendingSentinelRef = useRef<HTMLDivElement>(null);
  const topArtistsContainerRef = useRef<HTMLDivElement>(null);
  const topArtistsSentinelRef = useRef<HTMLDivElement>(null);
  const albumsContainerRef = useRef<HTMLDivElement>(null);
  const albumsSentinelRef = useRef<HTMLDivElement>(null);
  const singlesContainerRef = useRef<HTMLDivElement>(null);
  const singlesSentinelRef = useRef<HTMLDivElement>(null);

  // Generic intersection observer hook for horizontal infinite auto-scroll
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
    let isMounted = true;
    async function loadData() {
      try {
        const result = await fetchFullMusicData();
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading Firestore music data:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time listener for Top Artists & Trending Songs
  useEffect(() => {
    if (!data) return;
    const q = query(collectionGroup(db, 'songs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const artistStreams = new Map<string, number>();
      snapshot.forEach(doc => {
        const d = doc.data();
        const aid = d.artistId;
        const plays = Number(d.streamCount) || 0;
        if (aid) {
          artistStreams.set(aid, (artistStreams.get(aid) || 0) + plays);
        }
      });
      
      setData(prev => {
        if (!prev) return prev;
        const newTopArtists = [...prev.topArtists].sort((a, b) => {
          const aPlays = artistStreams.get(a.artistId) || 0;
          const bPlays = artistStreams.get(b.artistId) || 0;
          return bPlays - aPlays;
        });
        
        // Also update trending songs order
        const rawTrending = [...prev.trendingSongs].sort((a, b) => {
          const aPlays = snapshot.docs.find(d => d.id === a.id)?.data()?.streamCount || a.plays || 0;
          const bPlays = snapshot.docs.find(d => d.id === b.id)?.data()?.streamCount || b.plays || 0;
          return Number(bPlays) - Number(aPlays);
        });

        return { ...prev, topArtists: newTopArtists, trendingSongs: rawTrending };
      });
    }, (error) => console.warn("Real-time Top Artists error:", error));
    
    return () => unsubscribe();
  }, [data?.topArtists?.length]);

  useEffect(() => {
    if (!data) return;
    return setupAutoScrollObserver(
      trendingContainerRef.current,
      trendingSentinelRef.current,
      () => setTrendingLimit((prev) => prev + 10),
      trendingLimit < data.trendingSongs.length
    );
  }, [data, trendingLimit, setupAutoScrollObserver]);

  useEffect(() => {
    if (!data) return;
    return setupAutoScrollObserver(
      topArtistsContainerRef.current,
      topArtistsSentinelRef.current,
      () => setTopArtistsLimit((prev) => prev + 10),
      topArtistsLimit < data.topArtists.length
    );
  }, [data, topArtistsLimit, setupAutoScrollObserver]);

  useEffect(() => {
    if (!data) return;
    return setupAutoScrollObserver(
      albumsContainerRef.current,
      albumsSentinelRef.current,
      () => setAlbumsLimit((prev) => prev + 10),
      albumsLimit < data.albumsOnly.length
    );
  }, [data, albumsLimit, setupAutoScrollObserver]);

  useEffect(() => {
    if (!data) return;
    return setupAutoScrollObserver(
      singlesContainerRef.current,
      singlesSentinelRef.current,
      () => setSinglesLimit((prev) => prev + 10),
      singlesLimit < data.epsAndSingles.length
    );
  }, [data, singlesLimit, setupAutoScrollObserver]);

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

  // Determine which artists to show in the slider
  const allAvailableArtists = (data?.topArtists && data.topArtists.length > 0)
    ? data.topArtists
    : ((data?.artists && data.artists.length > 0) ? data.artists : firestoreArtists);

  const showSlider = allAvailableArtists.length > 0;

  return (
    <div id="home-view-container" className="h-full overflow-y-auto pb-28 md:pb-24 bg-transparent no-scrollbar relative">
      {(isLoading || !data) ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <React.Fragment>
          {/* Popular Artist Full-Width Hero Slider */}
          {showSlider && (
            <PopularArtistSlider artists={allAvailableArtists} />
          )}

          {/* Home Page Header - Overlaying the slider */}
          <header
            id="home-page-header"
            className="absolute top-0 z-30 w-full bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-4 md:px-8 py-4 select-none"
          >
            <button
              onClick={() => setCurrentTab('search')}
              className="w-10 h-10 flex items-center justify-center text-white bg-black/20 hover:bg-white/10 rounded-full transition-colors shrink-0 backdrop-blur-sm"
            >
              <Search className="w-6 h-6" />
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <a
            href="https://play.google.com/store/apps/details?id=com.jamiisound.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 text-sm font-bold text-black bg-white rounded-full hover:bg-neutral-200 transition-colors shadow-lg"
          >
            Open App
          </a>
        </div>

        <button
          onClick={() => setCurrentTab('menu')}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 text-white bg-black/20 hover:bg-white/10 rounded-full transition-colors shrink-0 backdrop-blur-sm"
        >
          <div className="w-6 h-0.5 bg-white rounded-full" />
          <div className="w-4 h-0.5 bg-white rounded-full self-end mr-2" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className={`px-4 md:px-8 space-y-12 ${showSlider ? 'mt-10' : 'mt-24'}`}>
        {/* 1. Trending Songs */}
        {data.trendingSongs.length > 0 && (
          <section id="home-trending-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-white" />
                <span>Trending Songs</span>
              </h2>
            </div>
            <div 
              ref={trendingContainerRef}
              className="flex gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 snap-x scroll-smooth"
              onScroll={(e) => handleScroll(e, () => setTrendingLimit(p => p + 10), trendingLimit < data.trendingSongs.length)}
            >
              {data.trendingSongs.slice(0, trendingLimit).map((track) => (
                <div
                  key={track.id}
                  className="shrink-0 snap-start flex flex-col cursor-pointer group w-36 sm:w-44"
                  onClick={() => playTrack(track, data.trendingSongs)}
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-lg border border-white/5 group-hover:border-white/20 transition-colors bg-neutral-900">
                    <img loading="lazy" decoding="async"
                      src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100 truncate group-hover:text-white w-full">
                    {track.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-1 w-full">
                    {track.artist}
                  </p>
                </div>
              ))}
              {trendingLimit < data.trendingSongs.length && (
                <div ref={trendingSentinelRef} className="snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2. Top Artists */}
        {data.topArtists.length > 0 && (
          <section id="home-top-artists">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <span>Top Artists</span>
                </h2>
              </div>
              <button
                onClick={() => setCurrentTab('charts')}
                className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white bg-transparent hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div 
              ref={topArtistsContainerRef}
              className="flex gap-6 overflow-x-auto no-scrollbar pb-3 pt-1 snap-x scroll-smooth"
              onScroll={(e) => handleScroll(e, () => setTopArtistsLimit(p => p + 10), topArtistsLimit < data.topArtists.length)}
            >
              {data.topArtists.slice(0, topArtistsLimit).map((artist, idx) => (
                <div
                  key={artist.artistId}
                  className="shrink-0 snap-start flex flex-col items-center text-center cursor-pointer group w-36 sm:w-44 bg-transparent p-0 border-0"
                  onClick={() => navigateToArtist(artist.artistId)}
                >
                  <div className="relative mb-3">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-xl border-2 border-neutral-800 group-hover:border-white transition-colors bg-neutral-900">
                      <img  loading="lazy" decoding="async"
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
                  <h3 className="font-semibold text-base text-slate-100 truncate group-hover:text-white w-full">
                    {artist.artistName}
                  </h3>
                </div>
              ))}
              {topArtistsLimit < data.topArtists.length && (
                <div ref={topArtistsSentinelRef} className="snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. Albums */}
        {data.albumsOnly.length > 0 && (
          <section id="home-albums-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-white" />
                <span>Albums</span>
              </h2>
            </div>
            <div 
              ref={albumsContainerRef}
              className="flex gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 snap-x scroll-smooth"
              onScroll={(e) => handleScroll(e, () => setAlbumsLimit(p => p + 10), albumsLimit < data.albumsOnly.length)}
            >
              {data.albumsOnly.slice(0, albumsLimit).map((album) => (
                <div
                  key={album.albumId}
                  className="shrink-0 snap-start flex flex-col cursor-pointer group w-36 sm:w-44"
                  onClick={() => navigateToAlbum(album.albumId)}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-lg border border-white/5 group-hover:border-white/20 transition-colors bg-neutral-900">
                    <img loading="lazy" decoding="async"
                      src={album.coverArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'}
                      alt={album.albumTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100 truncate group-hover:text-white w-full">
                    {album.albumTitle}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-1 w-full">
                    {album.artistName} • Album
                  </p>
                </div>
              ))}
              {albumsLimit < data.albumsOnly.length && (
                <div ref={albumsSentinelRef} className="snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. EPs & Singles */}
        {data.epsAndSingles.length > 0 && (
          <section id="home-singles-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-white" />
                <span>EPs & Singles</span>
              </h2>
            </div>
            <div 
              ref={singlesContainerRef}
              className="flex gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 snap-x scroll-smooth"
              onScroll={(e) => handleScroll(e, () => setSinglesLimit(p => p + 10), singlesLimit < data.epsAndSingles.length)}
            >
              {data.epsAndSingles.slice(0, singlesLimit).map((album) => (
                <div
                  key={album.albumId}
                  className="shrink-0 snap-start flex flex-col cursor-pointer group w-36 sm:w-44"
                  onClick={() => navigateToAlbum(album.albumId)}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-lg border border-white/5 group-hover:border-white/20 transition-colors bg-neutral-900">
                    <img loading="lazy" decoding="async"
                      src={album.coverArt || 'https://images.unsplash.com/photo-1493225457124-a1a2a537f7c1?auto=format&fit=crop&w=600&q=80'}
                      alt={album.albumTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100 truncate group-hover:text-white w-full">
                    {album.albumTitle}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-1 w-full uppercase">
                    {album.artistName} • {album.type}
                  </p>
                </div>
              ))}
              {singlesLimit < data.epsAndSingles.length && (
                <div ref={singlesSentinelRef} className="snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </React.Fragment>
  )}
</div>
);
};
