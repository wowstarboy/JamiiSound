with open('src/views/HomeView.tsx', 'r') as f:
    content = f.read()

import re
content = re.sub(r'<\/div>\s*<\/div>t\s*<div className="relative mb-3">', '</div>\n                    <div className="relative mb-3">', content)
content = re.sub(r'<\/div>i\s*<div className="relative mb-3">', '</div>\n                    <div className="relative mb-3">', content)
content = re.sub(r'<\/div>[a-z]\s*<div className="relative mb-3">', '</div>\n                    <div className="relative mb-3">', content)
with open('src/views/HomeView.tsx', 'w') as f:
    f.write(content)
