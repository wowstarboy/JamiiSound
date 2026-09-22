export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  audioSourceId?: string;
  trackNumber?: number;
  genre: string;
  tags: string[];
  plays: number;
  releaseYear: number;
  lyrics?: LyricLine[];
  bpm?: number;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  monthlyListeners: number;
  genres: string[];
  topTrackIds: string[];
  albumIds: string[];
  verified: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string;
  releaseYear: number;
  trackIds: string[];
  genre: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  createdAt: string;
  isCustom?: boolean;
  curator?: string;
  userId?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerMode = 'bars' | 'wave' | 'pulse';

export interface EqualizerSettings {
  bass: number;    // -12 to 12 dB
  mid: number;     // -12 to 12 dB
  treble: number;  // -12 to 12 dB
}

export type NavigationTab = 
  | 'home' 
  | 'search' 
  | 'library' 
  | 'favorites' 
  | 'playlist-details' 
  | 'album-details' 
  | 'artist-details'
  | 'menu'
  | 'charts';
