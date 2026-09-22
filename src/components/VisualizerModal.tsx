import React, { useEffect, useRef, useState } from 'react';
import { X, BarChart3, Activity, Disc3, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { VisualizerMode } from '../types';

export const VisualizerModal: React.FC = () => {
  const { 
    isVisualizerOpen, 
    setIsVisualizerOpen, 
    currentTrack, 
    isPlaying, 
    analyserNode,
    visualizerMode,
    setVisualizerMode
  } = useMusic();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [colorTheme, setColorTheme] = useState<'neon' | 'cyber' | 'sunset'>('neon');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (!isVisualizerOpen) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 128;
    let dataArray = new Uint8Array(bufferLength);

    if (analyserNode) {
      analyserNode.fftSize = 256;
      bufferLength = analyserNode.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let phase = 0;

    const render = () => {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Deep dark stage background
      ctx.fillStyle = 'rgba(11, 15, 25, 0.4)';
      ctx.fillRect(0, 0, width, height);

      phase += 0.04;

      if (analyserNode && isPlaying) {
        if (visualizerMode === 'wave') {
          analyserNode.getByteTimeDomainData(dataArray);
        } else {
          analyserNode.getByteFrequencyData(dataArray);
        }
      } else {
        // Ambient fallback animation if stopped or starting
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.sin(phase + i * 0.15) * 30 + 35;
        }
      }

      // Visual themes
      const getGradients = () => {
        if (colorTheme === 'cyber') {
          return { start: '#06b6d4', mid: '#3b82f6', end: '#8b5cf6' };
        }
        if (colorTheme === 'sunset') {
          return { start: '#f97316', mid: '#ec4899', end: '#a855f7' };
        }
        // neon emerald
        return { start: '#10b981', mid: '#06b6d4', end: '#6366f1' };
      };

      const theme = getGradients();

      if (visualizerMode === 'bars') {
        const barCount = 48;
        const spacing = 4;
        const barWidth = Math.max(3, (width - (barCount * spacing)) / barCount);
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, theme.start);
        grad.addColorStop(0.5, theme.mid);
        grad.addColorStop(1, theme.end);

        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * step] || 0;
          const percent = val / 255;
          const barHeight = Math.max(6, percent * (height * 0.75));
          const x = i * (barWidth + spacing) + spacing / 2;
          const y = height - barHeight - 20;

          // Glowing shadow
          ctx.shadowBlur = 12;
          ctx.shadowColor = theme.mid;
          ctx.fillStyle = grad;

          // Rounded bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (visualizerMode === 'wave') {
        ctx.lineWidth = 3.5;
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, theme.start);
        grad.addColorStop(0.5, theme.mid);
        grad.addColorStop(1, theme.end);

        ctx.strokeStyle = grad;
        ctx.shadowBlur = 16;
        ctx.shadowColor = theme.start;

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visualizerMode === 'pulse') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;

        let avg = 0;
        for (let i = 0; i < 30; i++) {
          avg += dataArray[i];
        }
        avg = avg / 30;
        const pulse = (avg / 255) * 45;

        // Outer glow circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = theme.end;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 24;
        ctx.shadowColor = theme.end;
        ctx.stroke();

        // Radiating frequency spikes
        const points = 64;
        const angleStep = (Math.PI * 2) / points;

        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const val = dataArray[i % bufferLength] || 10;
          const dist = baseRadius + (val / 255) * 80;
          const angle = i * angleStep + phase * 0.2;
          const px = centerX + Math.cos(angle) * dist;
          const py = centerY + Math.sin(angle) * dist;

          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = theme.start;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = theme.start;
        ctx.stroke();

        // Center album avatar circle
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisualizerOpen, analyserNode, isPlaying, visualizerMode, colorTheme]);

  if (!isVisualizerOpen) return null;

  return (
    <div 
      ref={containerRef}
      id="visualizer-modal-overlay"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-white overflow-hidden transition-all duration-300"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Audio Wave Spectrum
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">
                Live Web Audio
              </span>
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-sm">
              {currentTrack ? `${currentTrack.title} — ${currentTrack.artist}` : 'No track loaded'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              id="viz-mode-bars"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                visualizerMode === 'bars' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setVisualizerMode('bars')}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Spectrum</span>
            </button>
            <button
              id="viz-mode-wave"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                visualizerMode === 'wave' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setVisualizerMode('wave')}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Waveform</span>
            </button>
            <button
              id="viz-mode-pulse"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                visualizerMode === 'pulse' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setVisualizerMode('pulse')}
            >
              <Disc3 className="w-3.5 h-3.5" />
              <span>Pulse Ring</span>
            </button>
          </div>

          {/* Color theme switch */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              className={`w-6 h-6 rounded-full transition-transform ${
                colorTheme === 'neon' ? 'ring-2 ring-emerald-400 scale-110' : 'opacity-70 hover:opacity-100'
              } bg-gradient-to-r from-emerald-400 to-cyan-400`}
              onClick={() => setColorTheme('neon')}
              title="Neon Emerald"
            />
            <button
              className={`w-6 h-6 rounded-full transition-transform ${
                colorTheme === 'cyber' ? 'ring-2 ring-cyan-400 scale-110' : 'opacity-70 hover:opacity-100'
              } bg-gradient-to-r from-cyan-400 to-purple-500`}
              onClick={() => setColorTheme('cyber')}
              title="Cyberpunk"
            />
            <button
              className={`w-6 h-6 rounded-full transition-transform ${
                colorTheme === 'sunset' ? 'ring-2 ring-orange-400 scale-110' : 'opacity-70 hover:opacity-100'
              } bg-gradient-to-r from-orange-400 to-pink-500`}
              onClick={() => setColorTheme('sunset')}
              title="Sunset Amber"
            />
          </div>

          <button
            id="viz-fullscreen-btn"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            id="viz-close-btn"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            onClick={() => setIsVisualizerOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-6">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full rounded-2xl shadow-inner border border-slate-800/60"
        />

        {/* Dynamic track pill floating above visualizer */}
        {currentTrack && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 border border-slate-700/60 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-2xl">
            <img 
              src={currentTrack.coverUrl} 
              alt={currentTrack.title} 
              className={`w-12 h-12 rounded-xl object-cover shadow-md ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="font-semibold text-slate-100 text-sm">{currentTrack.title}</div>
              <div className="text-xs text-slate-400">{currentTrack.artist} • {currentTrack.album}</div>
            </div>
            <div className="flex items-center gap-1.5 pl-2 text-xs font-medium text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time EQ</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
