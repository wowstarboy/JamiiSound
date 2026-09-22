with open('src/components/MobileNav.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "className={`md:hidden fixed ${currentTab === 'album-details' ? 'hidden' : ''} bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#000000] dark:via-[#000000]/80 dark:to-transparent flex items-center justify-around z-30 px-3 pb-2 select-none\"\n    >",
    "className={`md:hidden fixed ${currentTab === 'album-details' ? 'hidden' : ''} bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#000000] dark:via-[#000000]/80 dark:to-transparent flex items-center justify-around z-30 px-3 pb-2 select-none`}\n    >"
)

with open('src/components/MobileNav.tsx', 'w') as f:
    f.write(content)
