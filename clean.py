import re

with open('src/views/HomeView.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'                \{trendingLimit < data\.trendingSongs\.length && \([\s\S]*?\}\)', '', content)
content = re.sub(r'                \{topArtistsLimit < data\.topArtists\.length && \([\s\S]*?\}\)', '', content)
content = re.sub(r'                \{albumsLimit < data\.albumsOnly\.length && \([\s\S]*?\}\)', '', content)
content = re.sub(r'                \{singlesLimit < data\.epsAndSingles\.length && \([\s\S]*?\}\)', '', content)
content = re.sub(r'                \{popularArtistsLimit < data\.artists\.length && \([\s\S]*?\}\)', '', content)

with open('src/views/HomeView.tsx', 'w') as f:
    f.write(content)
