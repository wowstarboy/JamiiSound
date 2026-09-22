import React, { useState } from 'react';
import { 
  ArrowLeft,
  Search, 
  TrendingUp, 
  User, 
  ShieldCheck, 
  FileText, 
  Info, 
  Mail, 
  AlertTriangle, 
  Handshake, 
  LogOut, 
  LogIn,
  ChevronRight
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { PrivacyPolicyView } from './legal/PrivacyPolicyView';
import { TermsOfServiceView } from './legal/TermsOfServiceView';
import { AboutView } from './info/AboutView';
import { PartnershipView } from './info/PartnershipView';
import { ContactView } from './info/ContactView';
import { ReportView } from './info/ReportView';

type ModalType = 'privacy' | 'terms' | 'about' | 'contact' | 'report' | 'partnership' | null;

export const MenuView: React.FC = () => {
  const { setCurrentTab, currentUser, openAuthModal } = useMusic();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleNavigate = (tab: 'search' | 'home' | 'favorites' | 'library', scrollToId?: string) => {
    setCurrentTab(tab);
    if (scrollToId) {
      setTimeout(() => {
        const el = document.getElementById(scrollToId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  if (activeModal === 'privacy') {
    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 animate-in fade-in duration-200">
        <PrivacyPolicyView onBack={() => setActiveModal(null)} />
      </div>
    );
  }

  if (activeModal === 'terms') {
    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 animate-in fade-in duration-200">
        <TermsOfServiceView onBack={() => setActiveModal(null)} />
      </div>
    );
  }

  if (activeModal === 'about') {
    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 animate-in fade-in duration-200">
        <AboutView onBack={() => setActiveModal(null)} />
      </div>
    );
  }

  if (activeModal === 'partnership') {
    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 animate-in fade-in duration-200">
        <PartnershipView onBack={() => setActiveModal(null)} />
      </div>
    );
  }

  if (activeModal === 'contact') {
    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 animate-in fade-in duration-200">
        <ContactView onBack={() => setActiveModal(null)} />
      </div>
    );
  }

  if (activeModal === 'report') {
    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 animate-in fade-in duration-200">
        <ReportView onBack={() => setActiveModal(null)} />
      </div>
    );
  }

  return (
    <div id="menu-page" className="h-full overflow-y-auto no-scrollbar pb-28 md:pb-24 animate-in slide-in-from-right duration-300">
      {/* Top Header - styled like Artist View / Search Page with no border underline */}
      <header className="sticky top-0 z-30 w-full bg-gradient-to-b from-black via-black/80 to-transparent flex items-center justify-between px-4 md:px-8 py-3.5 mb-6 select-none">
        <div className="flex items-center gap-4">
          <button
            id="menu-back-btn"
            onClick={() => setCurrentTab('home')}
            className="w-12 h-12 flex items-center justify-center text-white bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-white text-xl md:text-2xl drop-shadow-md">
            Menu
          </span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 md:px-8 space-y-6">
        {/* Navigation Section */}
        <div className="space-y-2">
          <h2 className="text-xs uppercase font-semibold text-neutral-400 px-2 tracking-wider">
            Explore
          </h2>
          <div className="divide-y divide-white/5 bg-neutral-900/60 rounded-2xl border border-white/5 overflow-hidden">
            <button
              id="menu-nav-search"
              onClick={() => handleNavigate('search')}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-white" />
                <span className="text-sm font-medium">Search</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              id="menu-nav-chart"
              onClick={() => handleNavigate('home', 'home-top-charts')}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="text-sm font-medium">Chart</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              id="menu-nav-profile"
              onClick={() => {
                if (currentUser) {
                  handleNavigate('favorites');
                } else {
                  openAuthModal();
                }
              }}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-white" />
                <span className="text-sm font-medium">Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Legal & Info Section */}
        <div className="space-y-2">
          <h2 className="text-xs uppercase font-semibold text-neutral-400 px-2 tracking-wider">
            Information & Legal
          </h2>
          <div className="divide-y divide-white/5 bg-neutral-900/60 rounded-2xl border border-white/5 overflow-hidden">
            <button
              id="menu-info-privacy"
              onClick={() => setActiveModal('privacy')}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-white" />
                <span className="text-sm">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              id="menu-info-terms"
              onClick={() => setActiveModal('terms')}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-white" />
                <span className="text-sm">Terms of Service</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              id="menu-info-about"
              onClick={() => setActiveModal('about')}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-white" />
                <span className="text-sm">About JamiiSound</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              id="menu-info-contact"
              onClick={() => setActiveModal('contact')}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-white" />
                <span className="text-sm">Contact Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              id="menu-info-report"
              onClick={() => setActiveModal('report')}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-white" />
                <span className="text-sm">Report</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              id="menu-info-partnership"
              onClick={() => setActiveModal('partnership')}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Handshake className="w-5 h-5 text-white" />
                <span className="text-sm">Partnership</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Account Login / Logout */}
        <div className="pt-2">
          {currentUser ? (
            <button
              id="menu-auth-logout"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-neutral-900 border border-white/10 text-red-400 hover:bg-red-500/10 font-medium text-sm transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out ({currentUser.email || currentUser.displayName || 'User'})</span>
            </button>
          ) : (
            <button
              id="menu-auth-login"
              onClick={openAuthModal}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>Log In / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
