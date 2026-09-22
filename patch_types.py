import re
with open('src/types.ts', 'r') as f:
    content = f.read()

target = "  | 'album-details';"
replacement = "  | 'album-details'\n  | 'charts';"
content = content.replace(target, replacement)

with open('src/types.ts', 'w') as f:
    f.write(content)
