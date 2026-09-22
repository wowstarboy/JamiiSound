import re
with open("src/context/MusicContext.tsx", "r") as f:
    content = f.read()
content = content.replace("      currentTime,\n", "")
with open("src/context/MusicContext.tsx", "w") as f:
    f.write(content)
