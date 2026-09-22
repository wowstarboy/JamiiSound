with open('src/components/PlayerScreen.tsx', 'r') as f:
    content = f.read()

target = """              {(liveStreamCount !== null || currentTrack?.plays) ? (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/50 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-[pulse_2s_infinite]"></span>
                  {new Intl.NumberFormat().format(liveStreamCount ?? currentTrack!.plays)} listeners
                </div>
              ) : null}"""

replacement = """              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/50 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-[pulse_2s_infinite]"></span>
                {new Intl.NumberFormat().format(liveStreamCount ?? (currentTrack?.plays || 0))} listeners
              </div>"""

content = content.replace(target, replacement)

with open('src/components/PlayerScreen.tsx', 'w') as f:
    f.write(content)
