import re
with open('src/views/HomeView.tsx', 'r') as f:
    content = f.read()

# Fix Icon
content = content.replace('<Flame className="w-5 h-5 text-orange-500" />', '<Flame className="w-5 h-5 text-white" />')

# Fix UI for trending songs to match albums
target_ui = """                <div
                  key={track.id}
                  className="shrink-0 snap-start flex flex-col cursor-pointer group w-36 sm:w-44 bg-neutral-900/40 hover:bg-neutral-800/60 p-3 rounded-xl transition-colors border border-white/5"
                  onClick={() => playTrack(track, data.trendingSongs)}
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 shadow-lg bg-neutral-900">
                    <img loading="lazy" decoding="async"
                      src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100 truncate group-hover:text-white w-full">
                    {track.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-1 group-hover:text-slate-300 w-full">
                    {track.artist}
                  </p>
                </div>"""

replacement_ui = """                <div
                  key={track.id}
                  className="shrink-0 snap-start flex flex-col cursor-pointer group w-36 sm:w-44"
                  onClick={() => playTrack(track, data.trendingSongs)}
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-lg border border-white/5 group-hover:border-white/20 transition-colors bg-neutral-900">
                    <img loading="lazy" decoding="async"
                      src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100 truncate group-hover:text-white w-full">
                    {track.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-1 w-full">
                    {track.artist}
                  </p>
                </div>"""

content = content.replace(target_ui, replacement_ui)

with open('src/views/HomeView.tsx', 'w') as f:
    f.write(content)
