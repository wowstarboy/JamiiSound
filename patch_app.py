import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

if "import { ChartScreen }" not in content:
    content = content.replace(
        "import { ArtistProfileView } from './views/ArtistProfileView';",
        "import { ArtistProfileView } from './views/ArtistProfileView';\nimport { ChartScreen } from './views/ChartScreen';"
    )

route_target = r"\{currentTab === 'album-details' && <AlbumDetailsView \/>\}"
route_replacement = "{currentTab === 'album-details' && <AlbumDetailsView />}\n        {currentTab === 'charts' && <ChartScreen />}"

if "currentTab === 'charts'" not in content:
    content = re.sub(route_target, route_replacement, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
