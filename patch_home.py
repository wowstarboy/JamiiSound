import re
with open('src/views/HomeView.tsx', 'r') as f:
    content = f.read()

# Add imports
if "from 'firebase/firestore'" not in content:
    content = content.replace(
        "import { fetchFullMusicData, StructuredHomeData } from '../services/firestoreMusicService';",
        "import { fetchFullMusicData, StructuredHomeData } from '../services/firestoreMusicService';\nimport { collectionGroup, query, onSnapshot } from 'firebase/firestore';\nimport { db } from '../lib/firebase';"
    )

# Add real-time top artists hook
hook_target = r"  // Generic intersection observer hook for horizontal infinite auto-scroll"
hook_replacement = """  // Real-time listener for Top Artists
  useEffect(() => {
    if (!data) return;
    const q = query(collectionGroup(db, 'songs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const artistStreams = new Map<string, number>();
      snapshot.forEach(doc => {
        const d = doc.data();
        const aid = d.artistId;
        const plays = Number(d.streamCount) || 0;
        if (aid) {
          artistStreams.set(aid, (artistStreams.get(aid) || 0) + plays);
        }
      });
      
      setData(prev => {
        if (!prev) return prev;
        const newTopArtists = [...prev.topArtists].sort((a, b) => {
          const aPlays = artistStreams.get(a.artistId) || 0;
          const bPlays = artistStreams.get(b.artistId) || 0;
          return bPlays - aPlays;
        });
        
        // Also update trending songs order
        const rawTrending = [...prev.trendingSongs].sort((a, b) => {
          const aPlays = snapshot.docs.find(d => d.id === a.id)?.data()?.streamCount || a.plays || 0;
          const bPlays = snapshot.docs.find(d => d.id === b.id)?.data()?.streamCount || b.plays || 0;
          return Number(bPlays) - Number(aPlays);
        });

        return { ...prev, topArtists: newTopArtists, trendingSongs: rawTrending };
      });
    }, (error) => console.warn("Real-time Top Artists error:", error));
    
    return () => unsubscribe();
  }, [data?.topArtists?.length]);

  // Generic intersection observer hook for horizontal infinite auto-scroll"""

if "// Real-time listener for Top Artists" not in content:
    content = content.replace(hook_target, hook_replacement)

# Fix chevron right in Top Artists Header and rank badge
header_target = r"""              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <span>Top Artists</span>
                  </h2>
                </div>
              </div>"""

header_replacement = """              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <span>Top Artists</span>
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentTab('charts')}
                  className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white bg-transparent hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>"""

content = content.replace(header_target, header_replacement)

# Import ChevronRight if not imported
if "ChevronRight" not in content:
    content = content.replace("Play, TrendingUp, Search, Flame, Disc3, Radio", "Play, TrendingUp, Search, Flame, Disc3, Radio, ChevronRight")

# Fix Avatar badge (move from inside overflow-hidden to outside absolute bottom-right)
avatar_target = r"""                    <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mb-3 shadow-xl border-2 border-neutral-800 group-hover:border-white transition-colors bg-neutral-900">
                      <img  loading="lazy" decoding="async"
                        src={artist.profilePicture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4\?auto=format&fit=crop&w=600&q=80'}
                        alt={artist.artistName}
                        
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-1 right-2 w-7 h-7 rounded-full bg-white text-neutral-950 font-bold text-xs flex items-center justify-center shadow-lg border-2 border-black">
                        #\{idx \+ 1\}
                      </div>
                    </div>"""

avatar_replacement = """                    <div className="relative mb-3">
                      <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-xl border-2 border-neutral-800 group-hover:border-white transition-colors bg-neutral-900">
                        <img  loading="lazy" decoding="async"
                          src={artist.profilePicture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
                          alt={artist.artistName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center shadow-md border-[2.5px] border-black z-10">
                        {idx + 1}
                      </div>
                    </div>"""

content = re.sub(avatar_target, avatar_replacement, content)

with open('src/views/HomeView.tsx', 'w') as f:
    f.write(content)
