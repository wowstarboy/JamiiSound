import re
with open('src/context/MusicContext.tsx', 'r') as f:
    content = f.read()

# Add imports
if "from 'firebase/firestore'" not in content:
    content = content.replace(
        "import { audioEngine } from '../services/audioEngine';",
        "import { audioEngine } from '../services/audioEngine';\nimport { doc, updateDoc, increment } from 'firebase/firestore';\nimport { db } from '../lib/firebase';"
    )

# Add update to playTrack
target = """    setCurrentTrack(track);
    setDuration(track.duration);
    setCurrentTime(0);
    audioEngine.loadTrack(track, true);
    setIsPlayerOpen(true);
  }, [queue, currentTrack]);"""

replacement = """    setCurrentTrack(track);
    setDuration(track.duration);
    setCurrentTime(0);
    audioEngine.loadTrack(track, true);
    setIsPlayerOpen(true);

    // Increment stream count in Firestore
    if (track.artistId && track.id) {
      updateDoc(doc(db, `artists/${track.artistId}/songs/${track.id}`), {
        streamCount: increment(1)
      }).catch(err => console.warn("Failed to increment stream count:", err));
    }
  }, [queue, currentTrack]);"""

content = content.replace(target, replacement)

with open('src/context/MusicContext.tsx', 'w') as f:
    f.write(content)

