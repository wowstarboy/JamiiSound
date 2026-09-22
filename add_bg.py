with open('src/views/AlbumDetailsView.tsx', 'r') as f:
    content = f.read()

target = '      {/* Sticky Header */}'
replacement = """      {/* Background Hero Banner (blurred) */}
      <div className="absolute top-0 inset-x-0 h-[60vh] min-h-[400px] pointer-events-none overflow-hidden z-0">
        <img
          src={coverArtUrl}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover object-center blur-2xl scale-110 opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Sticky Header */}"""

content = content.replace(target, replacement)

with open('src/views/AlbumDetailsView.tsx', 'w') as f:
    f.write(content)
