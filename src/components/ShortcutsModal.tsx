import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play or pause current track' },
    { key: 'Ctrl + Right', desc: 'Skip to next track' },
    { key: 'Ctrl + Left', desc: 'Skip to previous track / restart' },
    { key: 'M', desc: 'Toggle audio mute' },
    { key: 'L', desc: 'Toggle synchronized lyrics' },
    { key: 'V', desc: 'Toggle audio spectrum visualizer' },
  ];

  return (
    <div 
      id="shortcuts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        id="shortcuts-modal-card"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100">Keyboard Shortcuts</h3>
          </div>
          <button
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-800/80">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <span className="text-slate-300">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px] shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
