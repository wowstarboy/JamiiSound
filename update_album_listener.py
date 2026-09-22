import re

with open('src/views/AlbumDetailsView.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import {\n  ArrowLeft,\n  Search,\n  Play,\n  Pause,\n  Shuffle,\n  Clock,\n  Heart,\n  MoreVertical,\n  ListPlus,\n  Plus,\n  Radio\n} from 'lucide-react';",
    "import {\n  ArrowLeft,\n  Search,\n  Play,\n  Pause,\n  Shuffle,\n  Clock,\n  Heart,\n  MoreVertical,\n  ListPlus,\n  Plus,\n  Radio,\n  Headphones\n} from 'lucide-react';\nimport { collection, query, onSnapshot } from 'firebase/firestore';\nimport { db } from '../lib/firebase';"
)

regex_target = r"  // Load all album tracks from Firestore with no limits and sort by trackNumber\n  useEffect\(\(\) => \{\n    let isMounted = true;\n    if \(activeAlbumId\) \{\n      const cached = getTracksByAlbumId\(activeAlbumId\);\n      if \(cached.length > 0\) \{\n        setAlbumTracks\(cached\);\n      \} else \{\n        setIsLoading\(true\);\n      \}\n      loadFullAlbumTracks\(activeAlbumId, album\?.artistId\)\n        \.then\(\(tracks\) => \{\n          if \(isMounted\) \{\n            const cached = getTracksByAlbumId\(activeAlbumId\);\n            const merged = new Map<string, Track>\(\);\n            cached\.forEach\(t => merged\.set\(t\.id, t\)\);\n            tracks\.forEach\(t => merged\.set\(t\.id, t\)\);\n            \n            const finalTracks = Array\.from\(merged\.values\(\)\)\.sort\(\(a, b\) => \{\n              if \(a\.trackNumber !== undefined && b\.trackNumber !== undefined\) \{\n                return a\.trackNumber - b\.trackNumber;\n              \}\n              if \(a\.trackNumber !== undefined\) return -1;\n              if \(b\.trackNumber !== undefined\) return 1;\n              return a\.title\.localeCompare\(b\.title\);\n            \}\);\n            \n            if \(finalTracks\.length > 0\) \{\n              setAlbumTracks\(finalTracks\);\n            \}\n            setIsLoading\(false\);\n          \}\n        \}\)\n        \.catch\(\(err\) => \{\n          console\.warn\('Error loading album tracks from Firestore:', err\);\n          if \(isMounted\) setIsLoading\(false\);\n        \}\);\n    \}\n    return \(\) => \{\n      isMounted = false;\n    \};\n  \}, \[activeAlbumId, album\?.artistId, loadFullAlbumTracks, getTracksByAlbumId\]\);"

replacement = """  // Load all album tracks from Firestore with no limits and sort by trackNumber
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    if (activeAlbumId) {
      const cached = getTracksByAlbumId(activeAlbumId);
      if (cached.length > 0) {
        setAlbumTracks(cached);
      } else {
        setIsLoading(true);
      }

      loadFullAlbumTracks(activeAlbumId, album?.artistId)
        .then((tracks) => {
          if (!isMounted) return;
          const cached = getTracksByAlbumId(activeAlbumId);
          const merged = new Map<string, Track>();
          cached.forEach(t => merged.set(t.id, t));
          tracks.forEach(t => merged.set(t.id, t));
          
          const finalTracks = Array.from(merged.values()).sort((a, b) => {
            if (a.trackNumber !== undefined && b.trackNumber !== undefined) {
              return a.trackNumber - b.trackNumber;
            }
            if (a.trackNumber !== undefined) return -1;
            if (b.trackNumber !== undefined) return 1;
            return a.title.localeCompare(b.title);
          });
          
          if (finalTracks.length > 0) {
            setAlbumTracks(finalTracks);
          }
          setIsLoading(false);

          // Setup real-time listener for stream counts
          if (album?.artistId) {
            const q = query(collection(db, `artists/${album.artistId}/songs`));
            unsubscribe = onSnapshot(q, (snapshot) => {
              if (!isMounted) return;
              const newTracksMap = new Map();
              snapshot.forEach(doc => {
                const data = doc.data();
                if (data.albumId === activeAlbumId) {
                  newTracksMap.set(data.songId || doc.id, Number(data.streamCount) || 0);
                }
              });

              setAlbumTracks(prevTracks => 
                prevTracks.map(t => {
                  if (newTracksMap.has(t.id) && newTracksMap.get(t.id) !== t.plays) {
                    return { ...t, plays: newTracksMap.get(t.id) };
                  }
                  return t;
                })
              );
            });
          }
        })
        .catch((err) => {
          console.warn('Error loading album tracks from Firestore:', err);
          if (isMounted) setIsLoading(false);
        });
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeAlbumId, album?.artistId, loadFullAlbumTracks, getTracksByAlbumId]);"""

import re
content = re.sub(regex_target, replacement, content)

with open('src/views/AlbumDetailsView.tsx', 'w') as f:
    f.write(content)

