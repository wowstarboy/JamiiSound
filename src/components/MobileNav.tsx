import React from 'react';
import { Home, Search, BarChart2, User } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const MobileNav: React.FC = () => {
  const { currentTab, setCurrentTab, currentUser, openAuthModal } = useMusic();

  return (
    <nav 
      id="soundwave-mobile-nav"
      className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-around z-50 px-3 pb-2 select-none"
    >
      <button
        id="mobile-nav-home"
        aria-label="Home"
        className="flex items-center justify-center p-3 rounded-full transition-colors text-white"
        onClick={() => setCurrentTab('home')}
      >
        <Home className={`w-6 h-6 text-white ${currentTab === 'home' ? 'fill-white' : ''}`} />
      </button>

      <button
        id="mobile-nav-search"
        aria-label="Search"
        className="flex items-center justify-center p-3 rounded-full transition-colors text-white"
        onClick={() => setCurrentTab('search')}
      >
        <Search className={`w-6 h-6 text-white ${currentTab === 'search' ? 'fill-white' : ''}`} />
      </button>

      <button
        id="mobile-nav-chart"
        aria-label="Charts"
        className="flex items-center justify-center p-3 rounded-full transition-colors text-white"
        onClick={() => setCurrentTab('charts')}
      >
        <BarChart2 className={`w-6 h-6 text-white ${currentTab === 'charts' ? 'fill-white' : ''}`} />
      </button>

      <button
        id="mobile-nav-profile"
        aria-label="Profile"
        className="flex items-center justify-center p-3 rounded-full transition-colors text-white"
        onClick={() => {
          if (!currentUser) {
            openAuthModal();
          } else {
            setCurrentTab('favorites');
          }
        }}
      >
        <User className={`w-6 h-6 text-white ${currentTab === 'favorites' ? 'fill-white' : ''}`} />
      </button>
    </nav>
  );
};
