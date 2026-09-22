import re

with open('src/components/PlayerScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "setIsMarquee(titleRef.current.scrollWidth > titleRef.current.clientWidth);",
    "setIsMarquee(titleRef.current.scrollWidth > (titleRef.current.parentElement?.clientWidth || 0));"
)

content = content.replace(
    "className={`text-xl font-bold text-white leading-tight inline-block pr-8 ${isMarquee ? 'animate-marquee' : 'truncate w-full'}`}",
    "className={`text-xl font-bold text-white leading-tight inline-block ${isMarquee ? 'animate-marquee' : 'truncate w-full'}`}"
)

with open('src/components/PlayerScreen.tsx', 'w') as f:
    f.write(content)
