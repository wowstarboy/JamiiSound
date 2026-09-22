with open('src/views/HomeView.tsx', 'r') as f:
    content = f.read()

replacements = [
    (
        "                  </div>\n                ))}\n              </div>\n            </section>\n          )}\n\n          {/* 2. Top Artists",
        "                  </div>\n                ))}\n                {trendingLimit < data.trendingSongs.length && (\n                  <div ref={trendingSentinelRef} className=\"snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0\">\n                    <div className=\"w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin\"></div>\n                  </div>\n                )}\n              </div>\n            </section>\n          )}\n\n          {/* 2. Top Artists"
    ),
    (
        "                  </div>\n                ))}\n              </div>\n            </section>\n          )}\n\n          {/* 3. Albums",
        "                  </div>\n                ))}\n                {topArtistsLimit < data.topArtists.length && (\n                  <div ref={topArtistsSentinelRef} className=\"snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0\">\n                    <div className=\"w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin\"></div>\n                  </div>\n                )}\n              </div>\n            </section>\n          )}\n\n          {/* 3. Albums"
    ),
    (
        "                  </div>\n                ))}\n              </div>\n            </section>\n          )}\n\n          {/* 4. EPs",
        "                  </div>\n                ))}\n                {albumsLimit < data.albumsOnly.length && (\n                  <div ref={albumsSentinelRef} className=\"snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0\">\n                    <div className=\"w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin\"></div>\n                  </div>\n                )}\n              </div>\n            </section>\n          )}\n\n          {/* 4. EPs"
    ),
    (
        "                  </div>\n                ))}\n              </div>\n            </section>\n          )}\n\n          {/* 5. Popular",
        "                  </div>\n                ))}\n                {singlesLimit < data.epsAndSingles.length && (\n                  <div ref={singlesSentinelRef} className=\"snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0\">\n                    <div className=\"w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin\"></div>\n                  </div>\n                )}\n              </div>\n            </section>\n          )}\n\n          {/* 5. Popular"
    ),
    (
        "                  </div>\n                ))}\n              </div>\n            </section>\n          )}\n        </div>",
        "                  </div>\n                ))}\n                {popularArtistsLimit < data.artists.length && (\n                  <div ref={popularArtistsSentinelRef} className=\"snap-start flex items-center justify-center min-h-[160px] w-20 opacity-60 shrink-0\">\n                    <div className=\"w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin\"></div>\n                  </div>\n                )}\n              </div>\n            </section>\n          )}\n        </div>"
    )
]

for old_str, new_str in replacements:
    if old_str in content:
        content = content.replace(old_str, new_str)
    else:
        print(f"NOT FOUND: {old_str[:50].replace(chr(10), ' ')}")

with open('src/views/HomeView.tsx', 'w') as f:
    f.write(content)

