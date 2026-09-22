import re
with open('src/router/Router.tsx', 'r') as f:
    content = f.read()

target = """    window.history.pushState(state, '', url);
  }, [currentTab, activeArtistId, activeAlbumId, activePlaylistId, isPlayerOpen]);"""

replacement = """    window.history.pushState(state, '', url);
  }, [currentTab, activeArtistId, activeAlbumId, activePlaylistId, isPlayerOpen]);

  // Scroll to top on route change
  useEffect(() => {
    const mainScrollView = document.getElementById('main-scroll-view');
    if (mainScrollView) {
      mainScrollView.scrollTo(0, 0);
    }
  }, [currentTab, activeArtistId, activeAlbumId, activePlaylistId]);"""

if "Scroll to top on route change" not in content:
    content = content.replace(target, replacement)

with open('src/router/Router.tsx', 'w') as f:
    f.write(content)
