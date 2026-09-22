with open('src/views/AlbumDetailsView.tsx', 'r') as f:
    content = f.read()

import re
content = re.sub(r'  useEffect\(\(\) => \{\s*let isMounted = true;\s*if \(activeAlbumId\) \{[\s\S]*?\}, \[activeAlbumId, album\?\.artistId, loadFullAlbumTracks, getTracksByAlbumId\]\);',
"""  useEffect(() => {
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
  }, [activeAlbumId, album?.artistId, loadFullAlbumTracks, getTracksByAlbumId]);""", content, count=1)

with open('src/views/AlbumDetailsView.tsx', 'w') as f:
    f.write(content)
