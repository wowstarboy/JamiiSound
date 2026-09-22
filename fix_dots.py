with open('src/views/AlbumDetailsView.tsx', 'r') as f:
    content = f.read()

target = """                      <span className="mx-1.5 opacity-50">•</span>
                      <span className="mx-1 opacity-50">•</span>
                      <span>
                        {new Intl.NumberFormat().format(track.plays || 0)} listeners
                      </span>"""

replacement = """                      <span className="mx-1.5 opacity-50">•</span>
                      <span>
                        {new Intl.NumberFormat().format(track.plays || 0)} listeners
                      </span>"""

content = content.replace(target, replacement)

with open('src/views/AlbumDetailsView.tsx', 'w') as f:
    f.write(content)
