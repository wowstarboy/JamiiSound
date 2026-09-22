// Interface ya Document ya Artist (/artists/{artistId})
export interface Artist {
  artistId: string;
  artistName: string;
  profilePicture: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  monthlyListeners: number;
  isVerified: boolean;
  isClaimed: boolean;
  claimedByUid: string | null;
  youtubeUrl: string;
  createdAt: string; // ISO Date String
}

// Interface ya Document ya Album/EP/Single (/artists/{artistId}/albums/{albumId})
export interface Album {
  albumId: string;
  albumTitle: string;
  artistId: string;
  artistName: string;
  coverArt: string;
  type: 'SINGLE' | 'EP' | 'ALBUM';
  tracksCount: number;
  releaseYear?: string | number;
  genre?: string;
  createdAt: string; // ISO Date String
}

// Interface ya Document ya Wimbo/Track (/artists/{artistId}/songs/{songId})
export interface Song {
  songId: string;
  audioSourceId: string; // YouTube Video ID inayotumika kwenye Lambda streaming
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  coverArt: string;
  duration: number; // Sekunde
  trackNumber?: number; // Mpangilio halisi wa nyimbo kwenye albamu
  releaseYear?: string | number;
  streamCount: number;
  genre?: string;
  createdAt: string; // ISO Date String
}

// Structure ya Collections na Sub-collections kwa ajili ya Helper Functions
export interface JamiiSoundFirestoreSchema {
  artists: Artist;
  albums: Album;
  songs: Song;
}
