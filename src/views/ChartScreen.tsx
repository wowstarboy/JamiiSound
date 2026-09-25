import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Search, Play, Disc, User as UserIcon } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { StructuredHomeData, getCachedMusicData, fetchFullMusicData } from '../services/firestoreMusicService';
import { collection, query, onSnapshot, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Artist as FirestoreArtist, Album as FirestoreAlbum } from '../types/collections';
import { Track } from '../types';
import { formatNumber } from '../utils/formatters';

type ChartTab = 'artists' | 'songs' | 'albums';

export const ChartScreen: React.FC = () => {
  const { setCurrentTab, navigateToArtist, navigateToAlbum, playTrack } = useMusic();
  const [activeTab, setActiveTab] = useState<ChartTab>('artists');
  const [data, setData] = useState<StructuredHomeData | null>(getCachedMusicData());
  const [isLoading, setIsLoading] = useState(!getCachedMusicData());

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (!data) setIsLoading(true);

    fetchFullMusicData().then((result) => {
      if (isMounted) {
        setData(result);
        setIsLoading(false);
      }
    }).catch(err => {
      console.error("Error fetching charts data:", err);
      if (isMounted) setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  const sortedSongs = useMemo(() => {
    if (!data?.tracks) return [];
    return [...data.tracks].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 50);
  }, [data?.tracks]);

  const sortedAlbums = useMemo(() => {
    if (!data?.albumsOnly || !data?.tracks) return [];
    
    // Calculate total listeners for each album
    const albumListeners = new Map<string, number>();
    data.tracks.forEach(track => {
      if (track.albumId) {
        albumListeners.set(track.albumId, (albumListeners.get(track.albumId) || 0) + (track.plays || 0));
      }
    });

    return [...data.albumsOnly]
      .map(album => ({
        ...album,
        totalListeners: albumListeners.get(album.albumId) || 0
      }))
      .sort((a, b) => b.totalListeners - a.totalListeners)
      .slice(0, 50);
  }, [data?.albumsOnly, data?.tracks]);

  const sortedArtists = useMemo(() => {
    if (!data?.topArtists) return [];
    return data.topArtists.slice(0, 50);
  }, [data?.topArtists]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 bg-transparent flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 w-full bg-[#000000] flex flex-col px-4 md:px-8 py-3.5 select-none">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentTab('home')}
            aria-label="Back"
            className="w-10 h-10 flex items-center justify-center text-white bg-transparent hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-white text-lg drop-shadow-md truncate px-4">
            Charts
          </h1>
          <button
            onClick={() => setCurrentTab('search')}
            aria-label="Search"
            className="w-10 h-10 flex items-center justify-center text-white bg-transparent hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>

        {/* Custom Tabs: Full-width, No underline, White active, Grey inactive, Larger active text */}
        <div className="flex w-full items-center">
          <button
            onClick={() => setActiveTab('artists')}
            className={`flex-1 py-2 text-center font-bold transition-all whitespace-nowrap ${
              activeTab === 'artists' ? 'text-white text-lg' : 'text-neutral-500 text-sm hover:text-neutral-300'
            }`}
          >
            Top Artists
          </button>
          <button
            onClick={() => setActiveTab('songs')}
            className={`flex-1 py-2 text-center font-bold transition-all whitespace-nowrap ${
              activeTab === 'songs' ? 'text-white text-lg' : 'text-neutral-500 text-sm hover:text-neutral-300'
            }`}
          >
            Top Songs
          </button>
          <button
            onClick={() => setActiveTab('albums')}
            className={`flex-1 py-2 text-center font-bold transition-all whitespace-nowrap ${
              activeTab === 'albums' ? 'text-white text-lg' : 'text-neutral-500 text-sm hover:text-neutral-300'
            }`}
          >
            Top Albums
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-8 pt-6" ref={containerRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'artists' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {sortedArtists.map((artist, idx) => (
                  <div
                    key={artist.artistId}
                    className="flex flex-col items-center text-center cursor-pointer group"
                    onClick={() => navigateToArtist(artist.artistId)}
                  >
                    <div className="relative mb-3">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-xl border-2 border-neutral-800 group-hover:border-white transition-colors bg-neutral-900">
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
                    <h3 className="font-semibold text-sm sm:text-base text-slate-100 truncate group-hover:text-white w-full">
                      {artist.artistName}
                    </h3>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'songs' && (
              <div className="flex flex-col gap-1">
                {sortedSongs.map((track, idx) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => playTrack(track, sortedSongs)}
                  >
                    <div className="w-8 text-center text-xs font-bold text-neutral-500 group-hover:text-white">
                      {idx + 1}
                    </div>
                    <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden shadow-md">
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-5 h-5 text-white fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                      <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'albums' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {sortedAlbums.map((album, idx) => (
                  <div
                    key={album.albumId}
                    className="flex flex-col cursor-pointer group"
                    onClick={() => navigateToAlbum(album.albumId)}
                  >
                    <div className="relative mb-3 aspect-square rounded-xl overflow-hidden shadow-xl border border-white/5 group-hover:border-white/20 transition-colors bg-neutral-900">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={album.coverArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'}
                        alt={album.albumTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shadow-md border-[2px] border-black z-10">
                        {idx + 1}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                      {album.albumTitle}
                    </h3>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {album.artistName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
