import re
with open('src/components/PlayerScreen.tsx', 'r') as f:
    content = f.read()

# Remove state and hook
hook_target = r"  const \[liveStreamCount, setLiveStreamCount\] = useState<number \| null>\(null\);\n\n  useEffect\(\(\) => \{\n    setLiveStreamCount\(null\);\n    if \(\!currentTrack\?\.artistId \|\| \!currentTrack\?\.id\) return;\n    const unsub = onSnapshot\(doc\(db, `artists/\$\{currentTrack\.artistId\}/songs/\$\{currentTrack\.id\}`\), \(docSnap\) => \{\n      if \(docSnap\.exists\(\)\) \{\n        setLiveStreamCount\(Number\(docSnap\.data\(\)\.streamCount\) \|\| null\);\n      \}\n    \}\);\n    return \(\) => unsub\(\);\n  \}, \[currentTrack\?\.artistId, currentTrack\?\.id\]\);"
content = re.sub(hook_target, "", content)

# Remove UI
ui_target = r"              <div className=\"flex items-center gap-1\.5 mt-1\.5 text-xs text-white/50 font-mono\">\n                <span className=\"w-1\.5 h-1\.5 rounded-full bg-white/50 animate-\[pulse_2s_infinite\]\"><\/span>\n                \{new Intl\.NumberFormat\(\)\.format\(liveStreamCount \?\? \(currentTrack\?\.plays \|\| 0\)\)\} listeners\n              <\/div>"
content = re.sub(ui_target, "", content)

with open('src/components/PlayerScreen.tsx', 'w') as f:
    f.write(content)
