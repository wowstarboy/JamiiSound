import re
with open('src/services/firestoreMusicService.ts', 'r') as f:
    content = f.read()

# Fix topArtists sort
target_artists = """  const topArtists = [...artists].sort((a, b) => {
    if ((b.monthlyListeners || 0) !== (a.monthlyListeners || 0)) {
      return (b.monthlyListeners || 0) - (a.monthlyListeners || 0);
    }
    return (b.followersCount || 0) - (a.followersCount || 0);
  });"""

replacement_artists = """  const artistStreamCounts = new Map<string, number>();
  songs.forEach(s => {
    artistStreamCounts.set(s.artistId, (artistStreamCounts.get(s.artistId) || 0) + (Number(s.streamCount) || 0));
  });

  const topArtists = [...artists].sort((a, b) => {
    const aPlays = artistStreamCounts.get(a.artistId) || 0;
    const bPlays = artistStreamCounts.get(b.artistId) || 0;
    return bPlays - aPlays;
  });"""

content = content.replace(target_artists, replacement_artists)

# Fix trendingSongs sort
target_trending = "  const trendingSongs = interleaveByArtist(rawTrending);"
replacement_trending = "  const trendingSongs = rawTrending;"
content = content.replace(target_trending, replacement_trending)

with open('src/services/firestoreMusicService.ts', 'w') as f:
    f.write(content)
