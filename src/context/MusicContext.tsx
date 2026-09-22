import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Track, 
  Playlist, 
  RepeatMode, 
  VisualizerMode, 
  EqualizerSettings, 
  NavigationTab 
} from '../types';
import { TRACKS } from '../data/musicData';
import { audioEngine } from '../services/audioEngine';
import { doc, updateDoc, increment, setDoc, deleteDoc, collection, getDocs, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { User, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Artist as FirestoreArtist, Album as FirestoreAlbum, Song as FirestoreSong } from '../types/collections';
import { fetchFullMusicData, fetchAlbumTracksFromFirestore, subscribeMusicData } from '../services/firestoreMusicService';
import { recordTrackPlay } from '../services/followManager';

export const EQ_PRESETS: Record<string, EqualizerSettings> = {
  'Flat': { bass: 0, mid: 0, treble: 0 },
  'Bass Boost': { bass: 8, mid: -1, treble: 1 },
  'Vocal Clarity': { bass: -2, mid: 7, treble: 4 },
  'Electronic Club': { bass: 7, mid: 2, treble: 6 },
  'Acoustic Warmth': { bass: 3, mid: 2, treble: 4 },
  'Treble Boost': { bass: -1, mid: 1, treble: 8 },
};

interface MusicContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  queueIndex: number;
  history: Track[];
  likedTrackIds: string[];
  playlists: Playlist[];
  currentTab: NavigationTab;
  activePlaylistId: string | null;
  activeAlbumId: string | null;
  activeArtistId: string | null;
  searchQuery: string;
  selectedGenre: string | null;
  isLyricsOpen: boolean;
  isVisualizerOpen: boolean;
  isQueueOpen: boolean;
  isEqualizerOpen: boolean;
  visualizerMode: VisualizerMode;
  equalizer: EqualizerSettings;
  activeEqPreset: string;
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null;
  analyserNode: AnalyserNode | null;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: (trackId: string) => void;
  isLiked: (trackId: string) => boolean;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  createPlaylist: (title: string, description: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  setCurrentTab: (tab: NavigationTab) => void;
  navigateToPlaylist: (playlistId: string) => void;
  navigateToAlbum: (albumId: string) => void;
  navigateToArtist: (artistId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedGenre: (genre: string | null) => void;
  setIsLyricsOpen: (open: boolean) => void;
  setIsVisualizerOpen: (open: boolean) => void;
  setIsQueueOpen: (open: boolean) => void;
  setIsEqualizerOpen: (open: boolean) => void;
  isPlayerOpen: boolean;
  setIsPlayerOpen: (open: boolean) => void;
  hasOpenedPlayerScreen: boolean;
  setHasOpenedPlayerScreen: (opened: boolean) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setEqPreset: (presetName: string) => void;
  setCustomEqualizer: (settings: Partial<EqualizerSettings>) => void;
  setSleepTimer: (minutes: number | null) => void;
  firestoreArtists: FirestoreArtist[];
  firestoreAlbums: FirestoreAlbum[];
  firestoreSongs: FirestoreSong[];
  firestoreTracks: Track[];
  isLoadingFirestore: boolean;
  getArtistById: (id: string) => FirestoreArtist | undefined;
  getAlbumById: (id: string) => FirestoreAlbum | undefined;
  getTracksByAlbumId: (albumId: string) => Track[];
  loadFullAlbumTracks: (albumId: string, artistId?: string) => Promise<Track[]>;
  getTracksByArtistId: (artistId: string) => Track[];
  getAlbumsByArtistId: (artistId: string) => FirestoreAlbum[];
  refreshFirestoreData: () => Promise<void>;
  currentUser: User | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

const STORAGE_LIKED = 'soundwave_liked_tracks';
const STORAGE_PLAYLISTS = 'soundwave_custom_playlists';

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firestoreArtists, setFirestoreArtists] = useState<FirestoreArtist[]>([]);
  const [firestoreAlbums, setFirestoreAlbums] = useState<FirestoreAlbum[]>([]);
  const [firestoreSongs, setFirestoreSongs] = useState<FirestoreSong[]>([]);
  const [firestoreTracks, setFirestoreTracks] = useState<Track[]>([]);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState<boolean>(true);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(180);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [history, setHistory] = useState<Track[]>([]);

  const refreshFirestoreData = useCallback(async () => {
    try {
      setIsLoadingFirestore(true);
      const data = await fetchFullMusicData(true);
      setFirestoreArtists(data.artists);
      setFirestoreAlbums(data.albums);
      setFirestoreSongs(data.songs);
      setFirestoreTracks(data.tracks);
      if (data.tracks.length > 0) {
        setQueue((prev) => (prev.length === 0 ? data.tracks : prev));

        // Deep linking: Check if URL has /player/:songId or trackId / songId query param to auto-play track and open player
        const path = window.location.pathname;
        let pathSongId: string | null = null;
        if (path.startsWith('/player/')) {
          pathSongId = path.replace('/player/', '').split('/')[0] || null;
        }

        const params = new URLSearchParams(window.location.search);
        const urlTrackId = pathSongId || params.get('trackId') || params.get('songId') || params.get('track');
        let matchedTrack = urlTrackId ? data.tracks.find((t) => t.id === urlTrackId) : null;

        if (matchedTrack) {
          setCurrentTrack(matchedTrack);
          setDuration(matchedTrack.duration);
          audioEngine.loadTrack(matchedTrack, true);
          setIsPlayerOpen(true);
        } else {
          setCurrentTrack((prev) => prev || data.tracks[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching Firestore data:', err);
    } finally {
      setIsLoadingFirestore(false);
    }
  }, []);

  // Sync music data on mount and subscribe to background data loads
  useEffect(() => {
    const unsubscribe = subscribeMusicData((data) => {
      setFirestoreArtists(data.artists);
      setFirestoreAlbums(data.albums);
      setFirestoreSongs(data.songs);
      setFirestoreTracks(data.tracks);
      setIsLoadingFirestore(false);
    });
    refreshFirestoreData();
    return () => unsubscribe();
  }, [refreshFirestoreData]);

  const getArtistById = useCallback((id: string) => {
    if (!id) return undefined;
    const cleanId = id.toLowerCase().trim();
    return firestoreArtists.find((a) => 
      a.artistId.toLowerCase() === cleanId || 
      a.artistId.toLowerCase() === `@${cleanId}` ||
      `@${a.artistId.toLowerCase()}` === cleanId ||
      a.artistName.toLowerCase() === cleanId
    );
  }, [firestoreArtists]);

  const getAlbumById = useCallback((id: string) => {
    if (!id) return undefined;
    return firestoreAlbums.find((a) => a.albumId === id || a.albumTitle.toLowerCase() === id.toLowerCase());
  }, [firestoreAlbums]);

  const getTracksByAlbumId = useCallback((albumId: string) => {
    if (!albumId) return [];
    const tracks = firestoreTracks.filter((t) => t.albumId === albumId || t.album.toLowerCase() === albumId.toLowerCase());
    return [...tracks].sort((a, b) => {
      if (a.trackNumber !== undefined && b.trackNumber !== undefined) {
        return a.trackNumber - b.trackNumber;
      }
      if (a.trackNumber !== undefined) return -1;
      if (b.trackNumber !== undefined) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [firestoreTracks]);

  const loadFullAlbumTracks = useCallback(async (albumId: string, artistId?: string): Promise<Track[]> => {
    try {
      const tracks = await fetchAlbumTracksFromFirestore(albumId, artistId);
      if (tracks.length > 0) {
        setFirestoreTracks((prev) => {
          const map = new Map<string, Track>();
          prev.forEach((t) => map.set(t.id, t));
          tracks.forEach((t) => map.set(t.id, t));
          return Array.from(map.values());
        });
      }
      return tracks;
    } catch (e) {
      console.warn('loadFullAlbumTracks error:', e);
      return getTracksByAlbumId(albumId);
    }
  }, [getTracksByAlbumId]);

  const getTracksByArtistId = useCallback((artistId: string) => {
    if (!artistId) return [];
    const cleanId = artistId.toLowerCase().trim();
    return firestoreTracks.filter((t) => 
      t.artistId.toLowerCase() === cleanId || 
      t.artistId.toLowerCase() === `@${cleanId}` ||
      `@${t.artistId.toLowerCase()}` === cleanId ||
      t.artist.toLowerCase() === cleanId
    );
  }, [firestoreTracks]);

  const getAlbumsByArtistId = useCallback((artistId: string) => {
    if (!artistId) return [];
    const cleanId = artistId.toLowerCase().trim();
    return firestoreAlbums.filter((a) => 
      a.artistId.toLowerCase() === cleanId || 
      a.artistId.toLowerCase() === `@${cleanId}` ||
      `@${a.artistId.toLowerCase()}` === cleanId ||
      a.artistName.toLowerCase() === cleanId
    );
  }, [firestoreAlbums]);

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [activeArtistId, setActiveArtistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Panels & modals
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpenState] = useState<boolean>(false);
  const [hasOpenedPlayerScreen, setHasOpenedPlayerScreen] = useState<boolean>(false);

  const setIsPlayerOpen = useCallback((open: boolean) => {
    setIsPlayerOpenState(open);
    if (open) {
      setHasOpenedPlayerScreen(true);
    }
  }, []);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  
  // Equalizer
  const [equalizer, setEqualizer] = useState<EqualizerSettings>(EQ_PRESETS['Flat']);
  const [activeEqPreset, setActiveEqPreset] = useState<string>('Flat');

  // Sleep timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const hasTriggeredHomeLogin = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentTab === 'home' && !hasTriggeredHomeLogin.current) {
      hasTriggeredHomeLogin.current = true;
      const timer = setTimeout(() => {
        if (!auth.currentUser) {
          setIsAuthModalOpen(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentTab]);

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Persistence for likes & playlists
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LIKED);
      return saved ? JSON.parse(saved) : ['track-1', 'track-2', 'track-6'];
    } catch {
      return ['track-1', 'track-2', 'track-6'];
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Load playlists from Firestore on auth change
  useEffect(() => {
    let unsubscribe = () => {};
    if (currentUser) {
      const q = query(collection(db, 'playlists'), where('userId', '==', currentUser.uid));
      getDocs(q).then(snapshot => {
        const fetchedPlaylists: Playlist[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          fetchedPlaylists.push({
            id: doc.id,
            title: data.title || 'Untitled Playlist',
            description: data.description || '',
            coverUrl: data.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
            trackIds: data.trackIds || [],
            createdAt: data.createdAt || new Date().toISOString(),
            isCustom: true,
            curator: data.curator || 'You',
            userId: data.userId
          });
        });
        setPlaylists(fetchedPlaylists);
      }).catch(err => console.warn("Error fetching playlists:", err));
    } else {
      setPlaylists([]);
    }
    return () => unsubscribe();
  }, [currentUser]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LIKED, JSON.stringify(likedTrackIds));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [likedTrackIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [playlists]);

  // Ref to hold current state for audio callbacks
  const stateRef = useRef({
    queue,
    queueIndex,
    repeatMode,
    isShuffled,
    currentTrack,
  });

  useEffect(() => {
    stateRef.current = {
      queue,
      queueIndex,
      repeatMode,
      isShuffled,
      currentTrack,
    };
  }, [queue, queueIndex, repeatMode, isShuffled, currentTrack]);

  // Audio engine initialization
  useEffect(() => {
    audioEngine.init({
      onTimeUpdate: (curr, dur) => {
        if (dur && !isNaN(dur) && dur > 0) {
          setDuration(dur);
        }
      },
      onEnded: () => {
        handleTrackEnded();
      },
      onError: (err) => {
        console.warn('Audio engine error:', err);
      },
      onPlayStateChange: (playing) => {
        setIsPlaying(playing);
      },
    });

    audioEngine.setVolume(volume);

    return () => {
      audioEngine.pause();
    };
  }, []);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerRemaining === null) return;
    if (sleepTimerRemaining <= 0) {
      audioEngine.pause();
      setIsPlaying(false);
      setSleepTimerMinutes(null);
      setSleepTimerRemaining(null);
      return;
    }

    const interval = window.setInterval(() => {
      setSleepTimerRemaining((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemaining]);

  const setSleepTimer = useCallback((minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (minutes === null) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
  }, []);

  // Track playback handlers
  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      const idx = queue.findIndex((t) => t.id === track.id);
      if (idx !== -1) {
        setQueueIndex(idx);
      } else {
        setQueue((prev) => [track, ...prev]);
        setQueueIndex(0);
      }
    }

    if (currentTrack) {
      setHistory((prev) => [currentTrack, ...prev.slice(0, 49)]);
    }

    const newPlays = (track.plays || 0) + 1;
    const updatedTrack = { ...track, plays: newPlays };

    setCurrentTrack(updatedTrack);
    setDuration(track.duration);
    audioEngine.loadTrack(updatedTrack, true);
    setIsPlayerOpen(true);

    // Optimistically update tracks state with new plays count
    setFirestoreTracks((prev) => 
      prev.map((t) => t.id === track.id ? { ...t, plays: newPlays } : t)
    );

    // Increment stream and listener count in Firestore
    if (track.artistId && track.id) {
      recordTrackPlay(track.artistId, track.id);
    }
  }, [queue, currentTrack]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      if (currentTrack) {
        audioEngine.play();
      } else if (queue.length > 0) {
        playTrack(queue[0]);
      }
    }
  }, [isPlaying, currentTrack, queue, playTrack]);

  const seek = useCallback((seconds: number) => {
    audioEngine.seek(seconds);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (isMuted) setIsMuted(false);
    audioEngine.setVolume(clamped);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  }, [isMuted, volume]);

  const nextTrack = useCallback(() => {
    const { queue: q, queueIndex: qIdx, isShuffled: shuffled } = stateRef.current;
    if (q.length === 0) return;

    let nextIdx = qIdx + 1;
    if (shuffled) {
      nextIdx = Math.floor(Math.random() * q.length);
    } else if (nextIdx >= q.length) {
      nextIdx = 0;
    }

    const next = q[nextIdx];
    if (next) {
      setQueueIndex(nextIdx);
      if (currentTrack) {
        setHistory((prev) => [currentTrack, ...prev.slice(0, 49)]);
      }
      setCurrentTrack(next);
      setDuration(next.duration);
      audioEngine.loadTrack(next, true);
    }
  }, [currentTrack]);

  const prevTrack = useCallback(() => {
    if (audioEngine.getCurrentTime() > 4) {
      seek(0);
      return;
    }

    const { queue: q, queueIndex: qIdx } = stateRef.current;
    if (q.length === 0) return;

    let prevIdx = qIdx - 1;
    if (prevIdx < 0) {
      prevIdx = q.length - 1;
    }

    const prev = q[prevIdx];
    if (prev) {
      setQueueIndex(prevIdx);
      setCurrentTrack(prev);
      setDuration(prev.duration);
      audioEngine.loadTrack(prev, true);
    }
  }, [seek]);

  const handleTrackEnded = useCallback(() => {
    const { repeatMode: rep, currentTrack: track } = stateRef.current;
    if (rep === 'one' && track) {
      seek(0);
      audioEngine.play();
    } else if (rep === 'all') {
      nextTrack();
    } else {
      // rep === 'off'
      const { queue: q, queueIndex: qIdx } = stateRef.current;
      if (qIdx < q.length - 1) {
        nextTrack();
      } else {
        setIsPlaying(false);
      }
    }
  }, [nextTrack, seek]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleLike = useCallback((trackId: string) => {
    setLikedTrackIds((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  }, []);

  const isLiked = useCallback((trackId: string) => {
    return likedTrackIds.includes(trackId);
  }, [likedTrackIds]);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const playNext = useCallback((track: Track) => {
    setQueue((prev) => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, track);
      return copy;
    });
  }, [queueIndex]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      if (prev.length <= 1) return prev;
      const copy = prev.filter((_, i) => i !== index);
      if (index < queueIndex) {
        setQueueIndex((idx) => idx - 1);
      } else if (index === queueIndex && index >= copy.length) {
        setQueueIndex(0);
      }
      return copy;
    });
  }, [queueIndex]);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  }, [currentTrack]);

  // Playlist management
  const createPlaylist = useCallback((title: string, description: string): Playlist => {
    const id = `pl-${Date.now()}`;
    const newPlaylist: Playlist = {
      id,
      title: title.trim() || 'My Playlist',
      description: description.trim() || 'Custom curated mix',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
      trackIds: [],
      createdAt: new Date().toISOString(),
      isCustom: true,
      curator: 'You',
    };

    if (currentUser) {
      setDoc(doc(db, 'playlists', id), {
        ...newPlaylist,
        userId: currentUser.uid,
      }).catch(err => console.warn("Error saving playlist to Firestore:", err));
    }

    setPlaylists((prev) => [newPlaylist, ...prev]);
    return newPlaylist;
  }, [currentUser]);

  const deletePlaylist = useCallback((playlistId: string) => {
    if (currentUser) {
      deleteDoc(doc(db, 'playlists', playlistId)).catch(err => console.warn("Error deleting playlist:", err));
    }
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (activePlaylistId === playlistId) {
      setCurrentTab('library');
      setActivePlaylistId(null);
    }
  }, [activePlaylistId, currentUser]);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    if (currentUser) {
      updateDoc(doc(db, 'playlists', playlistId), {
        trackIds: arrayUnion(trackId)
      }).catch(err => console.warn("Error adding track to playlist:", err));
    }
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId && !p.trackIds.includes(trackId)) {
          return { ...p, trackIds: [...p.trackIds, trackId] };
        }
        return p;
      })
    );
  }, [currentUser]);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    if (currentUser) {
      updateDoc(doc(db, 'playlists', playlistId), {
        trackIds: arrayRemove(trackId)
      }).catch(err => console.warn("Error removing track from playlist:", err));
    }
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) };
        }
        return p;
      })
    );
  }, [currentUser]);

  // Equalizer handlers
  const setEqPreset = useCallback((presetName: string) => {
    const preset = EQ_PRESETS[presetName];
    if (preset) {
      setActiveEqPreset(presetName);
      setEqualizer(preset);
      audioEngine.setEqualizer(preset);
    }
  }, []);

  const setCustomEqualizer = useCallback((settings: Partial<EqualizerSettings>) => {
    setEqualizer((prev) => {
      const updated = { ...prev, ...settings };
      setActiveEqPreset('Custom');
      audioEngine.setEqualizer(updated);
      return updated;
    });
  }, []);

  // Navigation helpers
  const navigateToPlaylist = useCallback((playlistId: string) => {
    setActivePlaylistId(playlistId);
    setCurrentTab('playlist-details');
  }, []);

  const navigateToAlbum = useCallback((albumId: string) => {
    setActiveAlbumId(albumId);
    setCurrentTab('album-details');
  }, []);

  const navigateToArtist = useCallback((artistId: string) => {
    setActiveArtistId(artistId);
    setCurrentTab('artist-details');
  }, []);

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        nextTrack();
      } else if (e.code === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        prevTrack();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLyricsOpen((prev) => !prev);
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setIsVisualizerOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack, toggleMute]);

  const value = useMemo(
    () => ({
      currentTrack,
      isPlaying,
      duration,
      volume,
      isMuted,
      isShuffled,
      repeatMode,
      queue,
      queueIndex,
      history,
      likedTrackIds,
      playlists,
      currentTab,
      activePlaylistId,
      activeAlbumId,
      activeArtistId,
      searchQuery,
      selectedGenre,
      isLyricsOpen,
      isVisualizerOpen,
      isQueueOpen,
      isEqualizerOpen,
      visualizerMode,
      equalizer,
      activeEqPreset,
      sleepTimerMinutes,
      sleepTimerRemaining,
      analyserNode: audioEngine.getAnalyser(),

      playTrack,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
      nextTrack,
      prevTrack,
      toggleShuffle,
      cycleRepeat,
      toggleLike,
      isLiked,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      createPlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      setCurrentTab,
      navigateToPlaylist,
      navigateToAlbum,
      navigateToArtist,
      setSearchQuery,
      setSelectedGenre,
      setIsLyricsOpen,
      setIsVisualizerOpen,
      setIsQueueOpen,
      setIsEqualizerOpen,
      isPlayerOpen,
      setIsPlayerOpen,
      hasOpenedPlayerScreen,
      setHasOpenedPlayerScreen,
      setVisualizerMode,
      setEqPreset,
      setCustomEqualizer,
      setSleepTimer,
      firestoreArtists,
      firestoreAlbums,
      firestoreSongs,
      firestoreTracks,
      isLoadingFirestore,
      getArtistById,
      getAlbumById,
      getTracksByAlbumId,
      loadFullAlbumTracks,
      getTracksByArtistId,
      getAlbumsByArtistId,
      refreshFirestoreData,
      currentUser,
      isAuthModalOpen,
      setIsAuthModalOpen,
      openAuthModal,
      closeAuthModal,
    }),
    [
      currentTrack,
      isPlaying,
      duration,
      volume,
      isMuted,
      isShuffled,
      repeatMode,
      queue,
      queueIndex,
      history,
      likedTrackIds,
      playlists,
      currentTab,
      activePlaylistId,
      activeAlbumId,
      activeArtistId,
      searchQuery,
      selectedGenre,
      isLyricsOpen,
      isVisualizerOpen,
      isQueueOpen,
      isEqualizerOpen,
      isPlayerOpen,
      setIsPlayerOpen,
      hasOpenedPlayerScreen,
      visualizerMode,
      equalizer,
      activeEqPreset,
      sleepTimerMinutes,
      sleepTimerRemaining,
      playTrack,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
      nextTrack,
      prevTrack,
      toggleShuffle,
      cycleRepeat,
      toggleLike,
      isLiked,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      createPlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      setCurrentTab,
      navigateToPlaylist,
      navigateToAlbum,
      navigateToArtist,
      setSearchQuery,
      setSelectedGenre,
      setIsLyricsOpen,
      setIsVisualizerOpen,
      setIsQueueOpen,
      setIsEqualizerOpen,
      setVisualizerMode,
      setEqPreset,
      setCustomEqualizer,
      setSleepTimer,
      firestoreArtists,
      firestoreAlbums,
      firestoreSongs,
      firestoreTracks,
      isLoadingFirestore,
      getArtistById,
      getAlbumById,
      getTracksByAlbumId,
      loadFullAlbumTracks,
      getTracksByArtistId,
      getAlbumsByArtistId,
      refreshFirestoreData,
      currentUser,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
    ]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export const useAudioTime = () => {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(audioEngine.getCurrentTime());
    }, 250);
    return () => clearInterval(interval);
  }, []);
  return time;
};
