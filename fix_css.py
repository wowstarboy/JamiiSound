import re

with open('src/index.css', 'r') as f:
    content = f.read()

content = re.sub(r'@keyframes marquee \{[\s\S]*?\}', '@keyframes marquee {\n  0% { transform: translate(0, 0); }\n  100% { transform: translate(-100%, 0); }\n}', content)
content = re.sub(r'\.animate-marquee \{[\s\S]*?\}', '.animate-marquee {\n  display: inline-block;\n  padding-left: 100%;\n  animation: marquee 12s linear infinite;\n}', content)

with open('src/index.css', 'w') as f:
    f.write(content)
