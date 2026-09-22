import re

with open('src/views/HomeView.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'(id="home-trending-songs".*?\{data\.trendingSongs\.slice.*?)\s*<\/div>\s*<\/section>',
    r'\1                {trendingLimit < data.trendingSongs.length && (\n                  <div ref={trendingSentinelRef} className="snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0">\n                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>\n                  </div>\n                )}\n              </div>\n            </section>',
    content, flags=re.DOTALL
)

content = re.sub(
    r'(id="home-top-artists".*?\{data\.topArtists\.slice.*?)\s*<\/div>\s*<\/section>',
    r'\1                {topArtistsLimit < data.topArtists.length && (\n                  <div ref={topArtistsSentinelRef} className="snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0">\n                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>\n                  </div>\n                )}\n              </div>\n            </section>',
    content, flags=re.DOTALL
)

with open('src/views/HomeView.tsx', 'w') as f:
    f.write(content)

