import re

with open('src/views/HomeView.tsx', 'r') as f:
    content = f.read()

# Fix trending songs
content = re.sub(
    r'(<div\s+ref=\{trendingContainerRef\}[^>]*>.*?(?:\{data\.trendingSongs\.slice\(0, trendingLimit\)\.map.*?\})?.*?)((?:<\/div>\s*)+)(<\/section>\s*\)\})',
    r'\1\n                {trendingLimit < data.trendingSongs.length && (\n                  <div ref={trendingSentinelRef} className="snap-start flex items-center justify-center min-h-[160px] w-16 opacity-60 shrink-0">\n                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>\n                  </div>\n                )}\n\2\3',
    content, flags=re.DOTALL
)

with open('src/views/HomeView.tsx', 'w') as f:
    f.write(content)
