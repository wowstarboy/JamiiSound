import re
with open('src/views/AlbumDetailsView.tsx', 'r') as f:
    content = f.read()

target = """                      <span className="flex-inline items-center gap-1 font-mono">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/50 animate-[pulse_2s_infinite] mr-1"></span>
                        {new Intl.NumberFormat().format(track.plays || 0)} listeners
                      </span>"""

replacement = """                      <span className="mx-1 opacity-50">•</span>
                      <span>
                        {new Intl.NumberFormat().format(track.plays || 0)} listeners
                      </span>"""

content = content.replace(target, replacement)

with open('src/views/AlbumDetailsView.tsx', 'w') as f:
    f.write(content)
