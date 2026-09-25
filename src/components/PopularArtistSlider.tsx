import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BadgeCheck, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Artist as FirestoreArtist } from '../types/collections';
import { useMusic } from '../context/MusicContext';
import { formatNumber } from '../utils/formatters';
import { AppLogo } from './AppLogo';
import { 
  getEffectiveUserId, 
  getLocalFollows, 
  toggleArtistFollow 
} from '../services/followManager';

interface PopularArtistSliderProps {
  artists: FirestoreArtist[];
}

export const PopularArtistSlider: React.FC<PopularArtistSliderProps> = ({ artists }) => {
  const { navigateToArtist } = useMusic();
  // Helper to get initial selection from artists prop
  const getInitialSelection = (inputArtists: FirestoreArtist[]) => {
    if (!inputArtists || inputArtists.length === 0) return [];
    const uniqueMap = new Map<string, FirestoreArtist>();
    inputArtists.forEach((art) => {
      if (art && art.artistId && !uniqueMap.has(art.artistId)) {
        uniqueMap.set(art.artistId, art);
      }
    });
    const uniqueList = Array.from(uniqueMap.values());
    return [...uniqueList].sort(() => Math.random() - 0.5).slice(0, 10);
  };

  const [selectedArtists, setSelectedArtists] = useState<FirestoreArtist[]>(() => getInitialSelection(artists));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [isInteracting, setIsInteracting] = useState(false);

  // Swipe / Drag handling refs
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragDistanceRef = useRef<number>(0);

  // Initialize follow status and handle artists updates
  useEffect(() => {
    if (!artists || artists.length === 0) return;

    // If we don't have selected artists yet (lazy init failed or prop was empty), set them
    if (selectedArtists.length === 0) {
      const top10 = getInitialSelection(artists);
      setSelectedArtists(top10);
      
      const localFollows = getLocalFollows();
      const initialFollowMap: Record<string, boolean> = {};
      top10.forEach((art) => {
        initialFollowMap[art.artistId] = localFollows.has(art.artistId);
      });
      setFollowedMap(initialFollowMap);
    } else {
      // Just update follow map for existing selection
      const localFollows = getLocalFollows();
      const nextFollowMap: Record<string, boolean> = { ...followedMap };
      selectedArtists.forEach((art) => {
        nextFollowMap[art.artistId] = localFollows.has(art.artistId);
      });
      setFollowedMap(nextFollowMap);
    }
  }, [artists]);

  const total = selectedArtists.length;

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-slide every 4.5 seconds when user is not actively swiping
  useEffect(() => {
    if (total <= 1 || isInteracting) return;

    const timer = setInterval(() => {
      handleNext();
    }, 4500);

    return () => clearInterval(timer);
  }, [total, isInteracting, handleNext]);

  // Handle follow toggle with stopPropagation
  const handleToggleFollow = async (e: React.MouseEvent, artist: FirestoreArtist) => {
    e.stopPropagation();
    const currentFollowState = !!followedMap[artist.artistId];
    const nextState = !currentFollowState;

    setFollowedMap((prev) => ({
      ...prev,
      [artist.artistId]: nextState,
    }));

    try {
      const userId = getEffectiveUserId();
      await toggleArtistFollow(artist.artistId, userId, currentFollowState);
    } catch (err) {
      console.warn('Error toggling follow for slider artist:', err);
    }
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsInteracting(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
    dragDistanceRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    touchEndXRef.current = e.touches[0].clientX;
    dragDistanceRef.current = touchEndXRef.current - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    setIsInteracting(false);
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const distance = touchEndXRef.current - touchStartXRef.current;
      if (distance < -45) {
        handleNext();
      } else if (distance > 45) {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Mouse Drag Handlers for desktop swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsInteracting(true);
    isDraggingRef.current = true;
    touchStartXRef.current = e.clientX;
    touchEndXRef.current = e.clientX;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || touchStartXRef.current === null) return;
    touchEndXRef.current = e.clientX;
    dragDistanceRef.current = touchEndXRef.current - touchStartXRef.current;
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current && touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const distance = touchEndXRef.current - touchStartXRef.current;
      if (distance < -45) {
        handleNext();
      } else if (distance > 45) {
        handlePrev();
      }
    }
    isDraggingRef.current = false;
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setTimeout(() => setIsInteracting(false), 200);
  };

  const handleCardClick = (artistId: string) => {
    // Only navigate if it wasn't a deliberate swipe drag
    if (Math.abs(dragDistanceRef.current) < 12) {
      navigateToArtist(artistId);
    }
  };

  if (selectedArtists.length === 0) {
    return (
      <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden bg-neutral-950 flex items-center justify-center">
        <AppLogo size={80} className="text-white/10 animate-pulse" />
        {/* Match the shadow gradient of the real slider */}
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>
    );
  }

  const currentArtist = selectedArtists[currentIndex];
  const isFollowing = !!followedMap[currentArtist.artistId];

  return (
    <section 
      id="home-popular-artist-slider"
      className="relative w-full overflow-hidden select-none cursor-pointer group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => handleCardClick(currentArtist.artistId)}
    >
      {/* Background Hero Banner matching Artist View style with bottom shadow */}
      <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden bg-neutral-950">
        <img
          key={currentArtist.artistId}
          src={
            currentArtist.profilePicture || 
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
          }
          alt={currentArtist.artistName}
          className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out filter brightness-95"
          referrerPolicy="no-referrer"
          loading="eager"
        />

        {/* Ambient Dark Overlay */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Artist View Bottom Gradient Shadow */}
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

        {/* Artist Information & Controls positioned at bottom */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10 flex flex-col justify-end z-10 pointer-events-none">
          <div 
            key={currentArtist.artistId}
            className="animate-slide-text flex flex-col items-start gap-2.5 max-w-3xl pointer-events-auto"
          >
            {/* Tag / Text with smooth animation - No background, no icons as requested */}
            <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest opacity-80">
              <span>Popular Artist</span>
            </div>

            {/* Artist Name with smooth entrance animation and drop-shadow */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight drop-shadow-2xl flex items-center gap-3">
              <span>{currentArtist.artistName}</span>
              {currentArtist.isVerified && (
                <BadgeCheck className="w-8 h-8 sm:w-10 sm:h-10 text-black fill-white shrink-0" />
              )}
            </h1>

            {/* Working Follow Button with stopPropagation */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                id={`slider-follow-btn-${currentArtist.artistId}`}
                onClick={(e) => handleToggleFollow(e, currentArtist)}
                className={`px-8 py-3 rounded-full text-sm font-bold border shadow-lg transition-all duration-200 cursor-pointer pointer-events-auto active:scale-95 ${
                  isFollowing
                    ? 'border-white bg-white text-black'
                    : 'border-white/40 bg-black/50 backdrop-blur-md text-white hover:border-white hover:bg-white/10'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          {/* Slide Indicator Dots (10 indicators) */}
          <div className="flex items-center gap-1.5 pt-8 pointer-events-auto">
            {selectedArtists.map((art, idx) => (
              <button
                key={art.artistId}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'w-8 bg-white' 
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
