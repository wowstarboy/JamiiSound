import React, { useEffect, useRef, Suspense } from 'react';
import { useMusic } from '../context/MusicContext';
import { NavigationTab } from '../types';

// Lazy Loaded Views
const HomeView = React.lazy(() => import('../views/HomeView').then(m => ({ default: m.HomeView })));
const SearchView = React.lazy(() => import('../views/SearchView').then(m => ({ default: m.SearchView })));
const FavoritesView = React.lazy(() => import('../views/FavoritesView').then(m => ({ default: m.FavoritesView })));
const PlaylistDetailsView = React.lazy(() => import('../views/PlaylistDetailsView').then(m => ({ default: m.PlaylistDetailsView })));
const AlbumDetailsView = React.lazy(() => import('../views/AlbumDetailsView').then(m => ({ default: m.AlbumDetailsView })));
const ArtistDetailsView = React.lazy(() => import('../views/ArtistDetailsView').then(m => ({ default: m.ArtistDetailsView })));
const MenuView = React.lazy(() => import('../views/MenuView').then(m => ({ default: m.MenuView })));
const ChartScreen = React.lazy(() => import('../views/ChartScreen').then(m => ({ default: m.ChartScreen })));

interface RouterProps {
  onOpenCreatePlaylist?: () => void;
}

interface HistoryRouteState {
  tab: NavigationTab;
  artistId?: string | null;
  albumId?: string | null;
  playlistId?: string | null;
  trackId?: string | null;
  isPlayerOpen?: boolean;
}

export const AppRouter: React.FC<RouterProps> = ({ onOpenCreatePlaylist }) => {
  const {
    currentTab,
    setCurrentTab,
    activeArtistId,
    activeAlbumId,
    activePlaylistId,
    navigateToArtist,
    navigateToAlbum,
    navigateToPlaylist,
    isPlayerOpen,
    setIsPlayerOpen,
    isNavigatingBack,
    isLyricsOpen,
    setIsLyricsOpen,
    isEqualizerOpen,
    setIsEqualizerOpen,
    isQueueOpen,
    setIsQueueOpen,
    isVisualizerOpen,
    setIsVisualizerOpen,
  } = useMusic();

  const isPoppingRef = useRef(false);

  // Check initial route on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/player/')) {
      setIsPlayerOpen(true);
    } else if (path.startsWith('/album/')) {
      const parts = path.replace('/album/', '').split('/track/');
      const albumId = parts[0];
      if (albumId) {
        navigateToAlbum(albumId);
      }
    } else if (path.startsWith('/artist/')) {
      const artistId = path.replace('/artist/', '');
      if (artistId) navigateToArtist(artistId);
    } else if (path.startsWith('/playlist/')) {
      const playlistId = path.replace('/playlist/', '');
      if (playlistId) navigateToPlaylist(playlistId);
    } else if (path === '/search') {
      setCurrentTab('search');
    } else if (path === '/library') {
      setCurrentTab('library');
    } else if (path === '/favorites' || path === '/profile') {
      setCurrentTab('favorites');
    } else if (path === '/menu') {
      setCurrentTab('menu');
    }
  }, [navigateToAlbum, navigateToArtist, navigateToPlaylist, setCurrentTab]);

  // Initialize initial history entry
  useEffect(() => {
    const initialState: HistoryRouteState = {
      tab: currentTab,
      artistId: activeArtistId,
      albumId: activeAlbumId,
      playlistId: activePlaylistId,
      isPlayerOpen,
    };
    window.history.replaceState(initialState, '', window.location.pathname);
  }, []);

  // Track navigation changes and push to browser history for device back support
  useEffect(() => {
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      return;
    }

    const state: HistoryRouteState = {
      tab: currentTab,
      artistId: activeArtistId,
      albumId: activeAlbumId,
      playlistId: activePlaylistId,
      isPlayerOpen,
    };

    let url = '/';
    if (isPlayerOpen && state.tab === currentTab) {
      // player is open
    }
    if (currentTab === 'search') url = '/search';
    else if (currentTab === 'library') url = '/library';
    else if (currentTab === 'favorites') url = '/profile';
    else if (currentTab === 'menu') url = '/menu';
    else if (currentTab === 'album-details' && activeAlbumId) url = `/album/${activeAlbumId}`;
    else if (currentTab === 'artist-details' && activeArtistId) url = `/artist/${activeArtistId}`;
    else if (currentTab === 'playlist-details' && activePlaylistId) url = `/playlist/${activePlaylistId}`;

    if (window.location.pathname.startsWith('/player/') && isPlayerOpen) {
      url = window.location.pathname;
    }

    if (isNavigatingBack) {
      window.history.replaceState(state, '', url);
    } else {
      window.history.pushState(state, '', url);
    }
  }, [currentTab, activeArtistId, activeAlbumId, activePlaylistId, isPlayerOpen, isNavigatingBack]);

  // Scroll to top on route change
  useEffect(() => {
    const mainScrollView = document.getElementById('main-scroll-view');
    if (mainScrollView) {
      mainScrollView.scrollTo(0, 0);
    }
  }, [currentTab, activeArtistId, activeAlbumId, activePlaylistId]);

  // Device Back Button & Browser Back Button (popstate listener)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      isPoppingRef.current = true;

      // 1. If any modal is open, close the modal first on device back
      if (isLyricsOpen) {
        setIsLyricsOpen(false);
        return;
      }
      if (isEqualizerOpen) {
        setIsEqualizerOpen(false);
        return;
      }
      if (isQueueOpen) {
        setIsQueueOpen(false);
        return;
      }
      if (isVisualizerOpen) {
        setIsVisualizerOpen(false);
        return;
      }

      // 2. If the full player screen is open, close player screen on device back
      if (isPlayerOpen) {
        setIsPlayerOpen(false);
        return;
      }

      // 3. Navigate back to previous view or fallback to home
      const state = event.state as HistoryRouteState | null;
      if (state && state.tab) {
        if (state.tab === 'artist-details' && state.artistId) {
          navigateToArtist(state.artistId);
        } else if (state.tab === 'album-details' && state.albumId) {
          navigateToAlbum(state.albumId);
        } else if (state.tab === 'playlist-details' && state.playlistId) {
          navigateToPlaylist(state.playlistId);
        } else {
          setCurrentTab(state.tab);
        }
      } else {
        // Fallback to home page
        setCurrentTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    isPlayerOpen,
    isLyricsOpen,
    isEqualizerOpen,
    isQueueOpen,
    isVisualizerOpen,
    setCurrentTab,
    navigateToArtist,
    navigateToAlbum,
    navigateToPlaylist,
    setIsPlayerOpen,
    setIsLyricsOpen,
    setIsEqualizerOpen,
    setIsQueueOpen,
    setIsVisualizerOpen,
  ]);

  // Render the active view based on the currentTab route
  const content = React.useMemo(() => {
    switch (currentTab) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'library':
        return null;
      case 'favorites':
        return (
          <div className="px-0 md:px-0 py-0 h-full">
            <FavoritesView />
          </div>
        );
      case 'playlist-details':
        return (
          <div className="px-4 md:px-8 py-6 h-full">
            <PlaylistDetailsView />
          </div>
        );
      case 'album-details':
        return <AlbumDetailsView />;
      case 'artist-details':
        return (
          <div className="px-0 md:px-0 py-0 h-full">
            <ArtistDetailsView />
          </div>
        );
      case 'menu':
        return (
          <div className="px-0 md:px-0 py-0 h-full">
            <MenuView />
          </div>
        );
      case 'charts':
        return <ChartScreen />;
      default:
        return <HomeView />;
    }
  }, [currentTab]);

  return (
    <Suspense fallback={<div className="h-full w-full bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>}>
      {content}
    </Suspense>
  );
};
