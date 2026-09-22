import re

# 1. Patch PlayerScreen.tsx
with open('src/components/PlayerScreen.tsx', 'r') as f:
    ps_content = f.read()

# Add onSnapshot to imports if missing
if 'onSnapshot' not in ps_content:
    ps_content = ps_content.replace(
        "import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';",
        "import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, onSnapshot } from 'firebase/firestore';"
    )

ps_hook = """  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    isShuffled,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    toggleLike,
    isLiked: contextIsLiked,
    setIsQueueOpen,
    setIsLyricsOpen,
    setIsEqualizerOpen,
    setSleepTimer,
  } = useMusic();"""

ps_hook_replacement = """  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    isShuffled,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    toggleLike,
    isLiked: contextIsLiked,
    setIsQueueOpen,
    setIsLyricsOpen,
    setIsEqualizerOpen,
    setSleepTimer,
  } = useMusic();

  const [liveStreamCount, setLiveStreamCount] = useState<number | null>(null);

  useEffect(() => {
    setLiveStreamCount(null);
    if (!currentTrack?.artistId || !currentTrack?.id) return;
    const unsub = onSnapshot(doc(db, `artists/${currentTrack.artistId}/songs/${currentTrack.id}`), (docSnap) => {
      if (docSnap.exists()) {
        setLiveStreamCount(Number(docSnap.data().streamCount) || null);
      }
    });
    return () => unsub();
  }, [currentTrack?.artistId, currentTrack?.id]);"""

if 'const [liveStreamCount' not in ps_content:
    ps_content = ps_content.replace(ps_hook, ps_hook_replacement)

# Add it to the UI, right under artist name maybe
ps_ui_target = """              onClick={(e) => {
                e.stopPropagation();
                // navigateToArtist handled by parent if needed, but in modal we might just close it
                onClose();
              }}
            >
              {currentTrack?.artist || 'Unknown Artist'}
            </span>
          </div>"""

ps_ui_replacement = """              onClick={(e) => {
                e.stopPropagation();
                // navigateToArtist handled by parent if needed, but in modal we might just close it
                onClose();
              }}
            >
              {currentTrack?.artist || 'Unknown Artist'}
            </span>
            {(liveStreamCount !== null || currentTrack?.plays) ? (
              <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-white/40 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"></span>
                {new Intl.NumberFormat().format(liveStreamCount ?? currentTrack!.plays)} listeners
              </div>
            ) : null}
          </div>"""

ps_content = ps_content.replace(ps_ui_target, ps_ui_replacement)

with open('src/components/PlayerScreen.tsx', 'w') as f:
    f.write(ps_content)

# 2. Patch App.tsx - No, MobileNav handling inside AlbumDetailsView

# 3. Patch AlbumDetailsView.tsx
with open('src/views/AlbumDetailsView.tsx', 'r') as f:
    av_content = f.read()

# Fix handleBack
av_content = re.sub(
    r"  const handleBack = \(\) => \{\s*if \(window\.history\.length > 1\) \{\s*window\.history\.back\(\);\s*\} else \{\s*setCurrentTab\('home'\);\s*\}\s*\};",
    "  const handleBack = () => {\n    setCurrentTab('home');\n  };",
    av_content
)

# Replace Layout
layout_target = r"      \{\/\* Full-Screen Top Album Image Hero Banner \*\/\}[\s\S]*?\{\/\* Action Buttons: Play Album & Shuffle \*\/\}"

layout_replacement = """      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full pt-3.5 pb-2 px-4 md:px-8 flex items-center justify-between bg-gradient-to-b from-black via-black/90 to-transparent">
        <button
          onClick={handleBack}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center text-white bg-black/20 hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-white text-lg drop-shadow-md truncate px-4">
          {album?.artistName || albumTracks[0]?.artist || 'Artist'}
        </span>
        <button
          onClick={() => setCurrentTab('search')}
          aria-label="Search"
          className="w-10 h-10 flex items-center justify-center text-white bg-black/20 hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <Search className="w-5 h-5" />
        </button>
      </header>

      {/* Album Info Section */}
      <div className="relative w-full flex flex-col pt-8 pb-6 px-4 sm:px-8 z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Cover Art */}
          <div className="shrink-0">
            <img
              src={coverArtUrl}
              alt={album?.albumTitle || 'Album Cover'}
              className="w-56 h-56 sm:w-64 sm:h-64 rounded-xl shadow-2xl object-cover pointer-events-auto"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Hero Content */}
          <div className="flex flex-col gap-3 w-full text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-wider">
                {album?.type || 'ALBUM'}
              </span>
              <span className="text-xs text-white/70">
                {albumTracks.length} {albumTracks.length === 1 ? 'Song' : 'Songs'}
              </span>
              {releaseYear && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-xs text-white/70">{releaseYear}</span>
                </>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg">
              {album?.albumTitle || 'Album'}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-white/90">
              {album?.artistId && (
                <button
                  onClick={() => navigateToArtist(album.artistId)}
                  className="font-bold text-white hover:underline transition-all drop-shadow"
                >
                  {album?.artistName || 'Artist'}
                </button>
              )}
              {totalDuration > 0 && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-xs text-white/70 font-mono">
                    {formatTotalDuration(totalDuration)}
                  </span>
                </>
              )}
            </div>

            {/* Action Buttons: Play Album & Shuffle */}"""

av_content = re.sub(layout_target, layout_replacement, av_content)

# Add listeners UI to track row
track_ui_target = r"\{track\.artist\}\n\s*<\/span>\n\s*<\/div>"
track_ui_replacement = """{track.artist}
                      </span>
                      {track.plays > 0 && (
                        <>
                          <span className="mx-1.5 opacity-50">•</span>
                          <span>{new Intl.NumberFormat().format(track.plays)} listeners</span>
                        </>
                      )}
                    </div>"""

av_content = re.sub(track_ui_target, track_ui_replacement, av_content)

with open('src/views/AlbumDetailsView.tsx', 'w') as f:
    f.write(av_content)

