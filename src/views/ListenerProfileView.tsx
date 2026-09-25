import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Music2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Playlist } from '../types';

export const ListenerProfileView: React.FC = () => {
  const { 
    currentUser, 
    setCurrentTab,
    navigateToPlaylist,
  } = useMusic();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const fetchPlaylists = async () => {
      try {
        const q = query(
          collection(db, 'playlists'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const list: Playlist[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          list.push({
            id: doc.id,
            title: data.title || 'Untitled Playlist',
            description: data.description || '',
            coverUrl: data.coverUrl || '',
            trackIds: data.trackIds || [],
            createdAt: data.createdAt || new Date().toISOString(),
            isCustom: true,
            userId: data.userId
          });
        });
        setPlaylists(list);
      } catch (err) {
        console.warn('Error fetching listener playlists:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, [currentUser]);

  const handleBack = () => {
    setCurrentTab('home');
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center space-y-4">
        <UserIcon className="w-16 h-16 opacity-20" />
        <h2 className="text-xl font-bold">Please log in to see your profile</h2>
        <button 
          onClick={() => setCurrentTab('home')}
          className="px-6 py-2 bg-white text-black rounded-full font-bold"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 w-full h-[100dvh] overflow-y-auto overscroll-none text-white bg-black pb-28">
      {/* Hero Header */}
      <div className="relative h-[40vh] min-h-[300px] flex flex-col justify-end px-4 sm:px-8 pb-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-black z-10" />
          <img 
            src={currentUser.photoURL || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'} 
            className="w-full h-full object-cover opacity-40 blur-sm"
            alt="Blur BG"
          />
        </div>

        {/* Top Actions */}
        <header className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-4 md:px-8 py-3.5 select-none">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-white bg-black/20 backdrop-blur-md rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentTab('search')}
            className="w-10 h-10 flex items-center justify-center text-white bg-black/20 backdrop-blur-md rounded-full transition-colors"
          >
            <Search className="w-6 h-6" />
          </button>
        </header>

        <div className="relative z-20 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-2xl border-4 border-black shrink-0 bg-neutral-900">
            <img 
              src={currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'} 
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center sm:text-left flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Profile</span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">{currentUser.displayName || 'Listener'}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-10 space-y-12 relative z-10">
        {/* Playlists Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Public Playlists</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square bg-neutral-800 rounded-xl animate-pulse" />
                  <div className="h-4 w-3/4 bg-neutral-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
               {/* Skeleton Placeholder for empty playlists as requested */}
               <div className="aspect-square bg-neutral-900/50 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-3 opacity-40">
                  <Music2 className="w-8 h-8" />
                  <span className="text-xs font-medium">Empty Playlist</span>
               </div>
               {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-neutral-900/20 border border-white/5 rounded-xl opacity-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {playlists.map((playlist) => (
                <div 
                  key={playlist.id}
                  onClick={() => navigateToPlaylist(playlist.id)}
                  className="group cursor-pointer space-y-3"
                >
                  <div className="aspect-square bg-neutral-900 rounded-xl overflow-hidden relative shadow-lg border border-white/5 group-hover:border-white/20 transition-all">
                    {playlist.coverUrl ? (
                      <img 
                        src={playlist.coverUrl} 
                        alt={playlist.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                        <Music2 className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-sm truncate">{playlist.title}</h3>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
