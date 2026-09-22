with open('src/views/AlbumDetailsView.tsx', 'r') as f:
    content = f.read()

target = """          </div>
        </div>
      </div>

      {/* Tracklist - FULL WIDTH, TRANSPARENT, NO BACKGROUND BORDERS */}"""

replacement = """          </div>
        </div>
        </div>
      </div>

      {/* Tracklist - FULL WIDTH, TRANSPARENT, NO BACKGROUND BORDERS */}"""

content = content.replace(target, replacement)

with open('src/views/AlbumDetailsView.tsx', 'w') as f:
    f.write(content)
