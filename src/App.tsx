import React, { useState } from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { MobileNav } from './components/MobileNav';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { MiniPlayer } from './components/MiniPlayer';
import { PlayerScreen } from './components/PlayerScreen';
import { AppRouter } from './router';
import { AuthModal } from './views/auth/AuthModal';

const MainContent: React.FC = () => {
  const { isPlayerOpen, setIsPlayerOpen, isAuthModalOpen, closeAuthModal } = useMusic();
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-slate-100 font-sans selection:bg-white selection:text-slate-950 relative">
      {/* Main Workspace (No sidebar, full-width pure dark layout) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-transparent z-10">
        {/* Scrollable View Area (Header fits flush at the top) */}
        <main 
          id="main-scroll-view"
          className="flex-1 overflow-hidden relative h-full"
        >
          <div className="w-full h-full">
            <AppRouter onOpenCreatePlaylist={() => setCreatePlaylistOpen(true)} />
          </div>
        </main>

        {/* Mini Player Bar */}
        <MiniPlayer />

        {/* Mobile Navigation Tab Bar */}
        <MobileNav />
      </div>

      {/* Full Player Screen Modal */}
      {isPlayerOpen && (
        <PlayerScreen onClose={() => setIsPlayerOpen(false)} />
      )}

      {/* Modals & Overlays */}
      <CreatePlaylistModal 
        isOpen={createPlaylistOpen} 
        onClose={() => setCreatePlaylistOpen(false)} 
      />
      <ShortcutsModal 
        isOpen={shortcutsOpen} 
        onClose={() => setShortcutsOpen(false)} 
      />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
      />
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainContent />
    </MusicProvider>
  );
}
