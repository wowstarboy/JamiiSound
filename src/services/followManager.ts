import { 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  increment, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const DEVICE_UID_KEY = 'jamiisound_device_uid';
const LOCAL_FOLLOWS_KEY = 'jamiisound_local_follows';

export function getEffectiveUserId(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  let deviceUid = localStorage.getItem(DEVICE_UID_KEY);
  if (!deviceUid) {
    deviceUid = 'device_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem(DEVICE_UID_KEY, deviceUid);
  }
  return deviceUid;
}

export function getLocalFollows(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_FOLLOWS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

export function saveLocalFollow(artistId: string, isFollowing: boolean) {
  try {
    const set = getLocalFollows();
    if (isFollowing) {
      set.add(artistId);
    } else {
      set.delete(artistId);
    }
    localStorage.setItem(LOCAL_FOLLOWS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Could not save local follow:', err);
  }
}

export interface ArtistRealtimeStats {
  isFollowing: boolean;
  followersCount: number;
  monthlyListeners: number;
}

/**
 * Subscribes to real-time followers, follow status, and monthly listeners of an artist
 */
export function subscribeArtistFollow(
  artistId: string,
  userId: string,
  onUpdate: (stats: ArtistRealtimeStats) => void
): () => void {
  if (!artistId) return () => {};

  let currentFollowers = 0;
  let currentListeners = 0;
  let isFollowing = getLocalFollows().has(artistId);

  // 1. Listen to the artist document for followersCount and monthlyListeners in real-time
  const artistDocRef = doc(db, 'artists', artistId);
  const unsubArtist = onSnapshot(
    artistDocRef, 
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        currentFollowers = typeof data.followersCount === 'number' ? data.followersCount : 0;
        currentListeners = typeof data.monthlyListeners === 'number' ? data.monthlyListeners : (Number(data.totalStreams) || 0);
        onUpdate({
          isFollowing,
          followersCount: Math.max(0, currentFollowers),
          monthlyListeners: Math.max(0, currentListeners)
        });
      }
    },
    (err) => {
      console.warn('Realtime artist snapshot warning:', err);
    }
  );

  // 2. Listen to the follow status in real-time
  const followerDocRef = doc(db, `artists/${artistId}/followers/${userId}`);
  const unsubFollower = onSnapshot(
    followerDocRef,
    (snap) => {
      if (snap.exists()) {
        isFollowing = true;
        saveLocalFollow(artistId, true);
      } else {
        // Only set false if not set in local session
        if (!getLocalFollows().has(artistId)) {
          isFollowing = false;
        }
      }
      onUpdate({
        isFollowing,
        followersCount: Math.max(0, currentFollowers),
        monthlyListeners: Math.max(0, currentListeners)
      });
    },
    (err) => {
      // Fallback to local follows
      isFollowing = getLocalFollows().has(artistId);
      onUpdate({
        isFollowing,
        followersCount: Math.max(0, currentFollowers),
        monthlyListeners: Math.max(0, currentListeners)
      });
    }
  );

  return () => {
    unsubArtist();
    unsubFollower();
  };
}

/**
 * Toggles follow / unfollow on an artist in real-time in Firestore
 */
export async function toggleArtistFollow(
  artistId: string,
  userId: string,
  currentlyFollowing: boolean
): Promise<boolean> {
  const nextFollowing = !currentlyFollowing;
  saveLocalFollow(artistId, nextFollowing);

  const artistDocRef = doc(db, 'artists', artistId);
  const followerDocRef = doc(db, `artists/${artistId}/followers/${userId}`);
  const userFollowingDocRef = doc(db, `users/${userId}/following/${artistId}`);

  try {
    if (nextFollowing) {
      // Follow
      await Promise.allSettled([
        setDoc(followerDocRef, {
          userId,
          artistId,
          createdAt: new Date().toISOString()
        }),
        setDoc(userFollowingDocRef, {
          artistId,
          createdAt: new Date().toISOString()
        }),
        updateDoc(artistDocRef, {
          followersCount: increment(1)
        })
      ]);
    } else {
      // Unfollow
      await Promise.allSettled([
        deleteDoc(followerDocRef),
        deleteDoc(userFollowingDocRef),
        updateDoc(artistDocRef, {
          followersCount: increment(-1)
        })
      ]);
    }
  } catch (err) {
    console.warn('Error syncing follow to Firestore, preserved local state:', err);
  }

  return nextFollowing;
}

/**
 * Increments stream and listener count for track and artist in real-time
 */
export async function recordTrackPlay(artistId: string, songId: string): Promise<void> {
  if (!artistId || !songId) return;

  try {
    const songDocRef = doc(db, `artists/${artistId}/songs/${songId}`);
    const artistDocRef = doc(db, 'artists', artistId);
    const rootSongDocRef = doc(db, 'songs', songId);

    await Promise.allSettled([
      updateDoc(songDocRef, {
        streamCount: increment(1)
      }),
      updateDoc(artistDocRef, {
        monthlyListeners: increment(1),
        totalStreams: increment(1)
      }),
      updateDoc(rootSongDocRef, {
        streamCount: increment(1)
      })
    ]);
  } catch (err) {
    console.warn('Error incrementing stream count in Firestore:', err);
  }
}
