import { 
  collection, 
  getDocs, 
  collectionGroup,
  query,
  limit,
  doc,
  getDoc,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Artist as FirestoreArtist, Album as FirestoreAlbum, Song as FirestoreSong } from '../types/collections';
import { Track } from '../types';

export interface StructuredHomeData {
  artists: FirestoreArtist[];
  albums: FirestoreAlbum[];
  songs: FirestoreSong[];
  tracks: Track[];
  topArtists: FirestoreArtist[];
  topSongs: Track[];
  trendingSongs: Track[];
  jumpBackIn: { title: string; track: Track }[];
  albumsOnly: FirestoreAlbum[];
  epsAndSingles: FirestoreAlbum[];
}

let cachedData: StructuredHomeData | null = null;
let listeners: Array<(data: StructuredHomeData) => void> = [];

export function getCachedMusicData(): StructuredHomeData | null {
  return cachedData;
}

export function subscribeMusicData(callback: (data: StructuredHomeData) => void) {
  listeners.push(callback);
  if (cachedData) callback(cachedData);
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
}

export const firestoreSongToTrack = (
  song: FirestoreSong, 
  artistsMap?: Map<string, FirestoreArtist>,
  albumsMap?: Map<string, FirestoreAlbum>
): Track => {
  const artist = artistsMap?.get(song.artistId);
  const album = albumsMap?.get(song.albumId);
  
  const cover = song.coverArt?.trim() 
    || album?.coverArt?.trim() 
    || artist?.profilePicture?.trim() 
    || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';

  let relYear = 2024;
  if (song.releaseYear) {
    relYear = Number(song.releaseYear) || 2024;
  } else if (album?.releaseYear) {
    relYear = Number(album.releaseYear) || 2024;
  } else if (song.createdAt) {
    relYear = new Date(song.createdAt).getFullYear() || 2024;
  }

  const determinedGenre = song.genre || album?.genre || 'Bongo Flava';

  return {
    id: song.songId,
    title: song.title || 'Untitled Track',
    artist: song.artistName || artist?.artistName || 'Unknown Artist',
    artistId: song.artistId || '',
    album: song.albumTitle || album?.albumTitle || 'Single',
    albumId: song.albumId || '',
    duration: typeof song.duration === 'number' && song.duration > 0 ? Math.round(song.duration) : 180,
    coverUrl: cover,
    audioSourceId: song.audioSourceId || song.songId,
    audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.abs(song.songId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 12) + 1}.mp3`,
    genre: determinedGenre,
    trackNumber: song.trackNumber !== undefined ? Number(song.trackNumber) : undefined,
    tags: ['JamiiSound', determinedGenre, song.albumTitle || 'Single'],
    plays: typeof song.streamCount === 'number' ? song.streamCount : 0,
    releaseYear: relYear,
  };
};

// Cache for lazy loaded artist/album details to prevent redundant queries
const lazyAlbumsCache = new Map<string, FirestoreAlbum[]>();
const lazySongsCache = new Map<string, FirestoreSong[]>();

/**
 * Load ALL albums for a specific artist on demand without limits
 */
export async function fetchArtistAlbumsLazy(artistId: string): Promise<FirestoreAlbum[]> {
  if (lazyAlbumsCache.has(artistId)) {
    return lazyAlbumsCache.get(artistId)!;
  }
  const albums: FirestoreAlbum[] = [];
  try {
    const snap = await getDocs(collection(db, 'artists', artistId, 'albums'));
    snap.forEach((d) => {
      const data = d.data() as Partial<FirestoreAlbum>;
      albums.push({
        albumId: data.albumId || d.id,
        albumTitle: data.albumTitle || 'Untitled Album',
        artistId: data.artistId || artistId,
        artistName: data.artistName || '',
        coverArt: data.coverArt || '',
        type: (data.type as 'SINGLE' | 'EP' | 'ALBUM') || 'ALBUM',
        tracksCount: Number(data.tracksCount) || 1,
        releaseYear: data.releaseYear || '',
        genre: data.genre || '',
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
  } catch (e) {
    console.warn(`Error lazy fetching albums for ${artistId}:`, e);
  }
  lazyAlbumsCache.set(artistId, albums);
  return albums;
}

/**
 * Load ALL songs for a specific artist on demand without limits
 */
export async function fetchArtistSongsLazy(artistId: string): Promise<FirestoreSong[]> {
  if (lazySongsCache.has(artistId)) {
    return lazySongsCache.get(artistId)!;
  }
  const songs: FirestoreSong[] = [];
  try {
    const snap = await getDocs(collection(db, 'artists', artistId, 'songs'));
    snap.forEach((d) => {
      const data = d.data() as Partial<FirestoreSong>;
      songs.push({
        songId: data.songId || d.id,
        audioSourceId: data.audioSourceId || d.id,
        title: data.title || 'Untitled Song',
        artistId: data.artistId || artistId,
        artistName: data.artistName || '',
        albumId: data.albumId || '',
        albumTitle: data.albumTitle || 'Single',
        coverArt: data.coverArt || '',
        duration: Number(data.duration) || 180,
        trackNumber: data.trackNumber !== undefined ? Number(data.trackNumber) : undefined,
        releaseYear: data.releaseYear || '',
        genre: data.genre || '',
        streamCount: Number(data.streamCount) || 0,
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
  } catch (e) {
    console.warn(`Error lazy fetching songs for ${artistId}:`, e);
  }
  lazySongsCache.set(artistId, songs);
  return songs;
}

/**
 * Load ONLY a specific artist's profile, songs, and albums lazily on demand
 */
export async function fetchArtistFullDataLazy(artistId: string): Promise<{
  artist: FirestoreArtist | null;
  tracks: Track[];
  albums: FirestoreAlbum[];
}> {
  const cleanId = artistId.trim();
  let artist: FirestoreArtist | null = null;

  // 1. Fetch artist document
  try {
    const docRef = doc(db, 'artists', cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      artist = { ...(snap.data() as FirestoreArtist), artistId: snap.id };
    } else {
      const altId = cleanId.startsWith('@') ? cleanId.substring(1) : `@${cleanId}`;
      const altSnap = await getDoc(doc(db, 'artists', altId));
      if (altSnap.exists()) {
        artist = { ...(altSnap.data() as FirestoreArtist), artistId: altSnap.id };
      } else {
        const q = query(collection(db, 'artists'), where('artistName', '==', cleanId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          artist = { ...(qSnap.docs[0].data() as FirestoreArtist), artistId: qSnap.docs[0].id };
        }
      }
    }
  } catch (err) {
    console.warn(`Error fetching artist doc ${artistId}:`, err);
  }

  const actualArtistId = artist?.artistId || cleanId;

  // 2. Fetch albums and songs for ONLY this artist
  const [albums, songs] = await Promise.all([
    fetchArtistAlbumsLazy(actualArtistId),
    fetchArtistSongsLazy(actualArtistId)
  ]);

  // Fix album coverArt if missing using song metadata
  albums.forEach(alb => {
    if (!alb.coverArt) {
      const songWithCover = songs.find(s => s.albumId === alb.albumId && s.coverArt);
      if (songWithCover) alb.coverArt = songWithCover.coverArt;
    }
  });

  const artistsMap = new Map<string, FirestoreArtist>();
  if (artist) artistsMap.set(actualArtistId, artist);

  const albumsMap = new Map<string, FirestoreAlbum>();
  albums.forEach(a => albumsMap.set(a.albumId, a));

  const tracks = songs.map(s => firestoreSongToTrack(s, artistsMap, albumsMap));

  // If subcollection songs was empty, fallback query collectionGroup for this artist only
  if (tracks.length === 0) {
    try {
      const q = query(collectionGroup(db, 'songs'), where('artistId', '==', actualArtistId));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const s = d.data() as FirestoreSong;
        tracks.push(firestoreSongToTrack({ ...s, songId: s.songId || d.id }, artistsMap, albumsMap));
      });
    } catch (_) {}
  }

  // If subcollection albums was empty, fallback query collectionGroup for this artist only
  if (albums.length === 0) {
    try {
      const q = query(collectionGroup(db, 'albums'), where('artistId', '==', actualArtistId));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const a = d.data() as FirestoreAlbum;
        albums.push({ ...a, albumId: a.albumId || d.id });
      });
    } catch (_) {}
  }

  return { artist, tracks, albums };
}

/**
 * Fetch ALL tracks belonging to an album from Firestore, sorted by trackNumber
 */
export async function fetchAlbumTracksFromFirestore(
  albumId: string, 
  artistId?: string
): Promise<Track[]> {
  const songsMap = new Map<string, FirestoreSong>();
  const artistsMap = new Map<string, FirestoreArtist>();
  const albumsMap = new Map<string, FirestoreAlbum>();

  // 1. If artistId is provided or can be found, query artist's songs directly
  if (artistId) {
    try {
      const [artistSnap, songsSnap, albumSnap] = await Promise.all([
        getDoc(doc(db, 'artists', artistId)),
        getDocs(collection(db, 'artists', artistId, 'songs')),
        getDoc(doc(db, 'artists', artistId, 'albums', albumId))
      ]);

      if (artistSnap.exists()) {
        artistsMap.set(artistId, artistSnap.data() as FirestoreArtist);
      }
      if (albumSnap.exists()) {
        albumsMap.set(albumId, albumSnap.data() as FirestoreAlbum);
      }
      songsSnap.forEach((d) => {
        const data = d.data() as FirestoreSong;
        if (data.albumId === albumId) {
          const sid = data.songId || d.id;
          songsMap.set(sid, { ...data, songId: sid });
        }
      });
    } catch (e) {
      console.warn('Direct artist album query failed:', e);
    }
  }

  // 2. Also query collectionGroup('songs') for this albumId to ensure NO missing tracks
  try {
    const q = query(collectionGroup(db, 'songs'), where('albumId', '==', albumId));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data() as FirestoreSong;
      const sid = data.songId || d.id;
      if (!songsMap.has(sid)) {
        songsMap.set(sid, { ...data, songId: sid });
      }
    });
  } catch (e) {
    console.warn('collectionGroup query by albumId error:', e);
  }

  // 3. Convert to Track objects and sort strictly by trackNumber ascending
  const tracks = Array.from(songsMap.values()).map((song) => 
    firestoreSongToTrack(song, artistsMap, albumsMap)
  );

  tracks.sort((a, b) => {
    if (a.trackNumber !== undefined && b.trackNumber !== undefined) {
      return a.trackNumber - b.trackNumber;
    }
    if (a.trackNumber !== undefined) return -1;
    if (b.trackNumber !== undefined) return 1;
    return a.title.localeCompare(b.title);
  });

  return tracks;
}

/**
 * Lazy load album details and all its tracks on demand without limits
 */
export async function fetchAlbumFullDataLazy(
  albumId: string, 
  artistId?: string
): Promise<{
  album: FirestoreAlbum | null;
  tracks: Track[];
}> {
  let album: FirestoreAlbum | null = null;
  const cleanId = (albumId || '').trim();
  if (!cleanId) {
    return { album: null, tracks: [] };
  }

  // 1. Check in-memory cachedData first
  if (cachedData?.albums) {
    const found = cachedData.albums.find(
      (a) => a.albumId === cleanId || a.albumTitle.toLowerCase() === cleanId.toLowerCase()
    );
    if (found) album = found;
  }

  // 2. Fetch tracks belonging to this album
  const tracks = await fetchAlbumTracksFromFirestore(cleanId, artistId || album?.artistId);

  // 3. If album is not yet resolved, query Firestore
  if (!album) {
    const targetArtistId = artistId || tracks[0]?.artistId;
    if (targetArtistId) {
      try {
        const snap = await getDoc(doc(db, 'artists', targetArtistId, 'albums', cleanId));
        if (snap.exists()) {
          const d = snap.data() as Partial<FirestoreAlbum>;
          album = {
            albumId: d.albumId || snap.id,
            albumTitle: d.albumTitle || 'Untitled Album',
            artistId: d.artistId || targetArtistId,
            artistName: d.artistName || tracks[0]?.artist || '',
            coverArt: d.coverArt || tracks[0]?.coverUrl || '',
            type: (d.type as 'SINGLE' | 'EP' | 'ALBUM') || (tracks.length > 1 ? 'ALBUM' : 'SINGLE'),
            tracksCount: Number(d.tracksCount) || tracks.length || 1,
            releaseYear: d.releaseYear || '',
            genre: d.genre || tracks[0]?.genre || '',
            createdAt: d.createdAt || new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('Direct artist album fetch error:', e);
      }
    }

    // Try collectionGroup('albums')
    if (!album) {
      try {
        const q = query(collectionGroup(db, 'albums'), where('albumId', '==', cleanId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0].data() as Partial<FirestoreAlbum>;
          album = {
            albumId: d.albumId || snap.docs[0].id,
            albumTitle: d.albumTitle || 'Untitled Album',
            artistId: d.artistId || tracks[0]?.artistId || '',
            artistName: d.artistName || tracks[0]?.artist || '',
            coverArt: d.coverArt || tracks[0]?.coverUrl || '',
            type: (d.type as 'SINGLE' | 'EP' | 'ALBUM') || (tracks.length > 1 ? 'ALBUM' : 'SINGLE'),
            tracksCount: Number(d.tracksCount) || tracks.length || 1,
            releaseYear: d.releaseYear || '',
            genre: d.genre || tracks[0]?.genre || '',
            createdAt: d.createdAt || new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('collectionGroup album query error:', e);
      }
    }

    // Fallback: If tracks exist, construct album from track metadata
    if (!album && tracks.length > 0) {
      const first = tracks[0];
      album = {
        albumId: cleanId,
        albumTitle: first.album || 'Album',
        artistId: first.artistId || '',
        artistName: first.artist || '',
        coverArt: first.coverUrl || '',
        type: tracks.length > 1 ? 'ALBUM' : 'SINGLE',
        tracksCount: tracks.length,
        releaseYear: first.releaseYear ? String(first.releaseYear) : '',
        genre: first.genre || '',
        createdAt: new Date().toISOString(),
      };
    }
  } else if (!album.coverArt && tracks.length > 0) {
    // If we have the album object but it lacks coverArt, fill it from tracks
    album.coverArt = tracks[0].coverUrl;
  }

  return { album, tracks };
}

/**
 * Optimized and paginated fetch for initial Home view:
 * Avoids firing unbounded parallel subcollection queries.
 * Queries collection limits for fast initial load.
 */
export async function fetchFullMusicData(forceRefresh = false): Promise<StructuredHomeData> {
  if (cachedData && !forceRefresh) {
    return cachedData;
  }

  const artistsMap = new Map<string, FirestoreArtist>();
  const albumsMap = new Map<string, FirestoreAlbum>();
  const songsMap = new Map<string, FirestoreSong>();

  // 1. Fetch ALL Artists
  try {
    const artistsSnapshot = await getDocs(collection(db, 'artists'));
    artistsSnapshot.forEach((doc) => {
      const data = doc.data() as Partial<FirestoreArtist>;
      const artistId = data.artistId || doc.id;
      artistsMap.set(artistId, {
        artistId,
        artistName: data.artistName || doc.id.replace('@', ''),
        profilePicture: data.profilePicture || '',
        bio: data.bio || '',
        followersCount: Number(data.followersCount) || 0,
        followingCount: Number(data.followingCount) || 0,
        monthlyListeners: Number(data.monthlyListeners) || 0,
        isVerified: !!data.isVerified,
        isClaimed: !!data.isClaimed,
        claimedByUid: data.claimedByUid || null,
        youtubeUrl: data.youtubeUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
  } catch (err) {
    console.warn('Error fetching /artists:', err);
  }

  // 2. Fetch Songs via collectionGroup without limit
  try {
    const songsGroupSnap = await getDocs(collectionGroup(db, 'songs'));
    songsGroupSnap.forEach((doc) => {
      const data = doc.data() as Partial<FirestoreSong>;
      const songId = data.songId || doc.id;
      if (!songsMap.has(songId)) {
        songsMap.set(songId, {
          songId,
          audioSourceId: data.audioSourceId || songId,
          title: data.title || 'Untitled Song',
          artistId: data.artistId || '',
          artistName: data.artistName || 'Artist',
          albumId: data.albumId || '',
          albumTitle: data.albumTitle || 'Single',
          coverArt: data.coverArt || '',
          duration: Number(data.duration) || 180,
          trackNumber: data.trackNumber !== undefined ? Number(data.trackNumber) : undefined,
          releaseYear: data.releaseYear || '',
          genre: data.genre || '',
          streamCount: Number(data.streamCount) || 0,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      }
    });
  } catch (e) {
    console.warn('collectionGroup songs query:', e);
  }

  // 3. Fetch Albums via collectionGroup without limit
  try {
    const albumsGroupSnap = await getDocs(collectionGroup(db, 'albums'));
    albumsGroupSnap.forEach((doc) => {
      const data = doc.data() as Partial<FirestoreAlbum>;
      const albumId = data.albumId || doc.id;
      if (!albumsMap.has(albumId)) {
        albumsMap.set(albumId, {
          albumId,
          albumTitle: data.albumTitle || 'Untitled Album',
          artistId: data.artistId || '',
          artistName: data.artistName || 'Artist',
          coverArt: data.coverArt || '',
          type: (data.type as 'SINGLE' | 'EP' | 'ALBUM') || 'ALBUM',
          tracksCount: Number(data.tracksCount) || 1,
          releaseYear: data.releaseYear || '',
          genre: data.genre || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      }
    });
  } catch (e) {
    console.warn('collectionGroup albums query:', e);
  }

  // 4. Removed redundant per-artist subcollection queries to reduce Firestore load and overhead.
  // The collectionGroup queries above already capture all songs and albums.


  // Fix album coverArt if missing
  Array.from(songsMap.values()).forEach((song) => {
    if (song.albumId && albumsMap.has(song.albumId)) {
      const alb = albumsMap.get(song.albumId)!;
      if (!alb.coverArt && song.coverArt) {
        alb.coverArt = song.coverArt;
      }
    }
  });

  const artists = Array.from(artistsMap.values());
  const albums = Array.from(albumsMap.values());
  const songs = Array.from(songsMap.values());

  const tracks: Track[] = songs.map((s) => firestoreSongToTrack(s, artistsMap, albumsMap));

  // Sort artists by followers/listeners
  const artistStreamCounts = new Map<string, number>();
  songs.forEach(s => {
    artistStreamCounts.set(s.artistId, (artistStreamCounts.get(s.artistId) || 0) + (Number(s.streamCount) || 0));
  });

  const topArtists = [...artists].sort((a, b) => {
    const aPlays = artistStreamCounts.get(a.artistId) || 0;
    const bPlays = artistStreamCounts.get(b.artistId) || 0;
    return bPlays - aPlays;
  });

  // Interleave and mix helper: mixes items across artists so no artist dominates any section
  function interleaveByArtist<T extends { artistId?: string; artist?: string; artistName?: string }>(items: T[]): T[] {
    if (items.length <= 1) return items;
    const groups = new Map<string, T[]>();
    items.forEach((item) => {
      const key = item.artistId || item.artist || item.artistName || 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    const groupArrays = Array.from(groups.values());
    // Shuffle group order to create a fresh mix across artists
    for (let i = groupArrays.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [groupArrays[i], groupArrays[j]] = [groupArrays[j], groupArrays[i]];
    }

    let maxLen = 0;
    groupArrays.forEach((g) => {
      if (g.length > maxLen) maxLen = g.length;
    });

    const result: T[] = [];
    for (let i = 0; i < maxLen; i++) {
      for (const group of groupArrays) {
        if (i < group.length) {
          result.push(group[i]);
        }
      }
    }
    return result;
  }

  // Mixed trending songs across all artists
  const rawTrending = [...tracks].sort((a, b) => {
    return (b.plays || 0) - (a.plays || 0);
  });
  const trendingSongs = rawTrending;

  // Mixed top songs
  const topSongs = interleaveByArtist([...tracks]);

  const jumpBackIn = trendingSongs.map((track) => ({
    title: track.album || track.title,
    track,
  }));

  const rawAlbums = albums.filter((a) => a.type === 'ALBUM');
  const rawSingles = albums.filter((a) => a.type === 'EP' || a.type === 'SINGLE');

  if (rawAlbums.length === 0 && albums.length > 0) {
    albums.forEach((a) => {
      if (a.tracksCount > 1) {
        rawAlbums.push(a);
      } else {
        rawSingles.push(a);
      }
    });
  }

  // Mixed albums and singles across all artists
  const albumsOnly = interleaveByArtist(rawAlbums.length > 0 ? rawAlbums : albums);
  const epsAndSingles = interleaveByArtist(rawSingles.length > 0 ? rawSingles : albums);

  // Popular artists with diverse shuffle
  const popularArtists = [...artists];
  for (let i = popularArtists.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [popularArtists[i], popularArtists[j]] = [popularArtists[j], popularArtists[i]];
  }

  const structured: StructuredHomeData = {
    artists: popularArtists,
    albums,
    songs,
    tracks,
    topArtists,
    topSongs,
    trendingSongs,
    jumpBackIn,
    albumsOnly,
    epsAndSingles,
  };

  cachedData = structured;
  listeners.forEach((cb) => cb(structured));
  return structured;
}
