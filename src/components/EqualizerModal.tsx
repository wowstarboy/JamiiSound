import React from 'react';
import { X, Sliders, RotateCcw, Volume2 } from 'lucide-react';
import { useMusic, EQ_PRESETS } from '../context/MusicContext';

export const EqualizerModal: React.FC = () => {
  const {
    isEqualizerOpen,
    setIsEqualizerOpen,
    equalizer,
    setCustomEqualizer,
    activeEqPreset,
    setEqPreset,
  } = useMusic();

  if (!isEqualizerOpen) return null;

  return (
    <div 
      id="equalizer-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-200"
      onClick={() => setIsEqualizerOpen(false)}
    >
      <div 
        id="equalizer-modal-card"
        className="w-full max-w-lg bg-[#0e0e11] border border-white/10 rounded-3xl shadow-2xl p-6 text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/5 border border-white/10 text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Audio Equalizer</h3>
              <p className="text-xs text-neutral-400">3-Band Parametric Filter DSP</p>
            </div>
          </div>
          <button
            id="eq-close-btn"
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={() => setIsEqualizerOpen(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets List */}
        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5 block">
            Sound Presets
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(EQ_PRESETS).map((presetKey) => {
              const isActive = activeEqPreset === presetKey;
              return (
                <button
                  key={presetKey}
                  id={`eq-preset-${presetKey.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-center ${
                    isActive
                      ? 'bg-white text-black font-semibold border-white shadow-md'
                      : 'bg-neutral-900 border-white/10 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                  onClick={() => setEqPreset(presetKey)}
                >
                  {presetKey}
                </button>
              );
            })}
          </div>
        </div>

        {/* Equalizer Sliders Stage */}
        <div className="mt-6 bg-black/60 border border-white/10 rounded-2xl p-5">
          <div className="flex justify-around items-end h-48 pt-2">
            {/* Bass Band */}
            <div className="flex flex-col items-center gap-3 h-full justify-between">
              <span className="text-xs font-mono font-semibold text-white">
                {equalizer.bass > 0 ? `+${equalizer.bass}` : equalizer.bass} dB
              </span>
              <div className="relative h-32 flex items-center">
                <input
                  id="eq-slider-bass"
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={equalizer.bass}
                  onChange={(e) => setCustomEqualizer({ bass: Number(e.target.value) })}
                  className="accent-white h-2 w-28 -rotate-90 cursor-pointer bg-neutral-800 rounded-lg"
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-neutral-200">Bass</div>
                <div className="text-[10px] text-neutral-500">150 Hz</div>
              </div>
            </div>

            {/* Mid Band */}
            <div className="flex flex-col items-center gap-3 h-full justify-between">
              <span className="text-xs font-mono font-semibold text-white">
                {equalizer.mid > 0 ? `+${equalizer.mid}` : equalizer.mid} dB
              </span>
              <div className="relative h-32 flex items-center">
                <input
                  id="eq-slider-mid"
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={equalizer.mid}
                  onChange={(e) => setCustomEqualizer({ mid: Number(e.target.value) })}
                  className="accent-white h-2 w-28 -rotate-90 cursor-pointer bg-neutral-800 rounded-lg"
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-neutral-200">Mid</div>
                <div className="text-[10px] text-neutral-500">1 kHz</div>
              </div>
            </div>

            {/* Treble Band */}
            <div className="flex flex-col items-center gap-3 h-full justify-between">
              <span className="text-xs font-mono font-semibold text-white">
                {equalizer.treble > 0 ? `+${equalizer.treble}` : equalizer.treble} dB
              </span>
              <div className="relative h-32 flex items-center">
                <input
                  id="eq-slider-treble"
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={equalizer.treble}
                  onChange={(e) => setCustomEqualizer({ treble: Number(e.target.value) })}
                  className="accent-white h-2 w-28 -rotate-90 cursor-pointer bg-neutral-800 rounded-lg"
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-neutral-200">Treble</div>
                <div className="text-[10px] text-neutral-500">4 kHz</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between text-xs">
          <button
            id="eq-reset-btn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={() => setEqPreset('Flat')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Flat</span>
          </button>
          <span className="text-neutral-500 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Real-time BiquadFilter</span>
          </span>
        </div>
      </div>
    </div>
  );
};
