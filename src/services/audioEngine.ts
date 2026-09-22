import { EqualizerSettings, Track } from '../types';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface AudioEngineCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onError: (error: string) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export class AudioEngine {
  private mode: 'youtube' | 'html5' | 'synth' = 'html5';
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  
  // YouTube Player variables
  private ytPlayer: any = null;
  private ytReady = false;
  private ytPollInterval: number | null = null;
  private pendingYouTubeVideoId: string | null = null;

  // Generative synth fallback state
  private synthInterval: number | null = null;
  private synthGain: GainNode | null = null;
  private currentTrack: Track | null = null;
  private callbacks: AudioEngineCallbacks | null = null;
  private currentTime = 0;
  private duration = 180;
  private isPlaying = false;
  private timerInterval: number | null = null;
  private volume = 1.0;

  constructor() {
    this.initYouTubeApi();
  }

  private initYouTubeApi() {
    if (typeof window === 'undefined') return;

    // Check if script already loaded or exists
    const onApiReady = () => {
      this.setupYouTubePlayer();
    };

    if (window.YT && window.YT.Player) {
      this.setupYouTubePlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        onApiReady();
      };

      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }
  }

  private setupYouTubePlayer() {
    if (typeof window === 'undefined' || !window.YT || this.ytPlayer) return;

    // Create offscreen container
    let container = document.getElementById('jamii-yt-player-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'jamii-yt-player-container';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '240px';
      container.style.height = '240px';
      container.style.pointerEvents = 'none';
      container.style.opacity = '0.01';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      const targetDiv = document.createElement('div');
      targetDiv.id = 'jamii-yt-iframe-target';
      container.appendChild(targetDiv);
    }

    try {
      this.ytPlayer = new window.YT.Player('jamii-yt-iframe-target', {
        height: '240',
        width: '240',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.ytReady = true;
            if (this.pendingYouTubeVideoId) {
              const vid = this.pendingYouTubeVideoId;
              this.pendingYouTubeVideoId = null;
              this.loadYouTubeVideo(vid, true);
            }
          },
          onStateChange: (event: any) => {
            this.handleYouTubeStateChange(event.data);
          },
          onError: (event: any) => {
            console.warn('YouTube Player error encountered, falling back to direct audio stream:', event.data);
            this.fallbackToHtml5();
          }
        }
      });
    } catch (e) {
      console.warn('Could not initialize YouTube player:', e);
    }
  }

  private handleYouTubeStateChange(state: number) {
    // 1: PLAYING, 2: PAUSED, 0: ENDED, 3: BUFFERING
    if (this.mode !== 'youtube') return;

    if (state === 1) {
      this.isPlaying = true;
      this.callbacks?.onPlayStateChange(true);
      this.startYouTubeProgressPolling();
    } else if (state === 2) {
      this.isPlaying = false;
      this.callbacks?.onPlayStateChange(false);
      this.stopYouTubeProgressPolling();
    } else if (state === 0) {
      this.isPlaying = false;
      this.stopYouTubeProgressPolling();
      this.callbacks?.onEnded();
    }
  }

  private startYouTubeProgressPolling() {
    this.stopYouTubeProgressPolling();
    this.ytPollInterval = window.setInterval(() => {
      if (this.mode !== 'youtube' || !this.ytPlayer) return;
      try {
        if (typeof this.ytPlayer.getCurrentTime === 'function') {
          const cur = this.ytPlayer.getCurrentTime() || 0;
          const dur = this.ytPlayer.getDuration() || this.duration;
          this.currentTime = cur;
          if (dur > 0 && isFinite(dur)) {
            this.duration = dur;
          }
          this.callbacks?.onTimeUpdate(this.currentTime, this.duration);
        }
      } catch (err) {
        // Polling catch
      }
    }, 250);
  }

  private stopYouTubeProgressPolling() {
    if (this.ytPollInterval) {
      clearInterval(this.ytPollInterval);
      this.ytPollInterval = null;
    }
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public init(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
    if (typeof window === 'undefined') return;

    if (!this.audio) {
      this.audio = new Audio();
      // DO NOT set crossOrigin='anonymous' by default because it causes CORS 403 / failure on non-CORS CDNs
      this.audio.preload = 'auto';

      this.audio.addEventListener('timeupdate', () => {
        if (this.mode !== 'html5') return;
        if (this.audio) {
          this.currentTime = this.audio.currentTime;
          const dur = isNaN(this.audio.duration) || this.audio.duration === 0 ? (this.currentTrack?.duration || 180) : this.audio.duration;
          this.duration = dur;
          this.callbacks?.onTimeUpdate(this.currentTime, this.duration);
        }
      });

      this.audio.addEventListener('ended', () => {
        if (this.mode !== 'html5') return;
        this.callbacks?.onEnded();
      });

      this.audio.addEventListener('error', () => {
        if (this.mode !== 'html5') return;
        console.warn('Audio stream error. Activating synthesizer audio fallback.');
        this.startSynthFallback();
      });

      this.audio.addEventListener('play', () => {
        if (this.mode === 'html5') {
          this.isPlaying = true;
          this.callbacks?.onPlayStateChange(true);
        }
      });

      this.audio.addEventListener('pause', () => {
        if (this.mode === 'html5') {
          this.isPlaying = false;
          this.callbacks?.onPlayStateChange(false);
        }
      });
    }
  }

  private ensureAudioContext(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      if (!this.analyser && this.audioCtx) {
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;

        this.bassFilter = this.audioCtx.createBiquadFilter();
        this.bassFilter.type = 'lowshelf';
        this.bassFilter.frequency.value = 150;

        this.midFilter = this.audioCtx.createBiquadFilter();
        this.midFilter.type = 'peaking';
        this.midFilter.frequency.value = 1000;
        this.midFilter.Q.value = 1;

        this.trebleFilter = this.audioCtx.createBiquadFilter();
        this.trebleFilter.type = 'highshelf';
        this.trebleFilter.frequency.value = 4000;

        this.masterGain = this.audioCtx.createGain();
      }
    } catch (e) {
      console.warn('Web Audio context setup warning:', e);
    }

    return true;
  }

  // Determines if an ID or string is a YouTube Video ID (e.g., 11 alphanumeric chars like 0G_eJgApdVw)
  private isYouTubeId(id?: string): boolean {
    if (!id) return false;
    return /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
  }

  public async loadTrack(track: Track, autoPlay = true): Promise<void> {
    this.stopSynth();
    this.stopYouTubeProgressPolling();
    this.currentTrack = track;
    this.duration = track.duration || 180;
    this.currentTime = 0;
    this.callbacks?.onTimeUpdate(0, this.duration);

    this.ensureAudioContext();

    const ytId = track.audioSourceId && this.isYouTubeId(track.audioSourceId)
      ? track.audioSourceId
      : (this.isYouTubeId(track.id) ? track.id : null);

    if (ytId) {
      // Prioritize real YouTube Audio for Firestore tracks
      this.mode = 'youtube';
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
      }

      if (this.ytReady && this.ytPlayer) {
        this.loadYouTubeVideo(ytId, autoPlay);
      } else {
        this.pendingYouTubeVideoId = ytId;
        // In case YouTube API takes a moment or fails, prepare fallback HTML5
        if (autoPlay) {
          setTimeout(() => {
            if (!this.ytReady && this.mode === 'youtube') {
              console.log('YouTube loading taking longer, initiating fallback stream');
              this.fallbackToHtml5();
            }
          }, 3000);
        }
      }
    } else {
      // Direct MP3/Audio file playback
      this.loadHtml5Audio(track.audioUrl, autoPlay);
    }
  }

  private loadYouTubeVideo(videoId: string, autoPlay: boolean) {
    try {
      this.mode = 'youtube';
      if (typeof this.ytPlayer.loadVideoById === 'function') {
        if (autoPlay) {
          this.ytPlayer.loadVideoById({
            videoId: videoId,
            startSeconds: 0,
          });
          this.ytPlayer.setVolume(Math.round(this.volume * 100));
          this.isPlaying = true;
          this.callbacks?.onPlayStateChange(true);
          this.startYouTubeProgressPolling();
        } else {
          this.ytPlayer.cueVideoById({
            videoId: videoId,
            startSeconds: 0,
          });
          this.isPlaying = false;
          this.callbacks?.onPlayStateChange(false);
        }
      }
    } catch (e) {
      console.warn('Error playing YouTube video:', e);
      this.fallbackToHtml5();
    }
  }

  private loadHtml5Audio(url: string, autoPlay: boolean) {
    this.mode = 'html5';
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try { this.ytPlayer.pauseVideo(); } catch (_) {}
    }

    if (!this.audio) {
      this.init(this.callbacks || {
        onTimeUpdate: () => {},
        onEnded: () => {},
        onError: () => {},
        onPlayStateChange: () => {},
      });
    }

    if (this.audio) {
      this.audio.src = url;
      this.audio.volume = this.volume;
      this.audio.load();

      if (autoPlay) {
        this.audio.play().then(() => {
          this.isPlaying = true;
          this.callbacks?.onPlayStateChange(true);
        }).catch((err) => {
          console.warn('Autoplay prevented or stream failed, falling back:', err);
          if (err.name === 'NotAllowedError') {
            this.isPlaying = false;
            this.callbacks?.onPlayStateChange(false);
          } else {
            this.startSynthFallback();
          }
        });
      }
    }
  }

  private fallbackToHtml5() {
    if (!this.currentTrack) {
      this.startSynthFallback();
      return;
    }
    console.log('Switching to HTML5 audio stream for:', this.currentTrack.title);
    this.loadHtml5Audio(this.currentTrack.audioUrl, true);
  }

  public async play(): Promise<void> {
    this.ensureAudioContext();

    if (this.mode === 'synth') {
      this.resumeSynth();
      return;
    }

    if (this.mode === 'youtube' && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      try {
        this.ytPlayer.playVideo();
        this.isPlaying = true;
        this.callbacks?.onPlayStateChange(true);
        this.startYouTubeProgressPolling();
        return;
      } catch (e) {
        console.warn('YouTube play failed:', e);
        this.fallbackToHtml5();
        return;
      }
    }

    if (this.mode === 'html5' && this.audio) {
      try {
        await this.audio.play();
        this.isPlaying = true;
        this.callbacks?.onPlayStateChange(true);
      } catch (e) {
        console.warn('Audio play error:', e);
        this.startSynthFallback();
      }
      return;
    }

    if (this.currentTrack) {
      this.loadTrack(this.currentTrack, true);
    }
  }

  public pause(): void {
    if (this.mode === 'synth') {
      this.pauseSynth();
      return;
    }

    if (this.mode === 'youtube' && this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
        this.isPlaying = false;
        this.callbacks?.onPlayStateChange(false);
        this.stopYouTubeProgressPolling();
      } catch (_) {}
      return;
    }

    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      this.callbacks?.onPlayStateChange(false);
    }
  }

  public seek(seconds: number): void {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));

    if (this.mode === 'synth') {
      this.callbacks?.onTimeUpdate(this.currentTime, this.duration);
      return;
    }

    if (this.mode === 'youtube' && this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      try {
        this.ytPlayer.seekTo(this.currentTime, true);
      } catch (_) {}
      this.callbacks?.onTimeUpdate(this.currentTime, this.duration);
      return;
    }

    if (this.audio && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
      this.audio.currentTime = this.currentTime;
    } else {
      this.callbacks?.onTimeUpdate(this.currentTime, this.duration);
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));

    if (this.audio) {
      this.audio.volume = this.volume;
    }

    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      try {
        this.ytPlayer.setVolume(Math.round(this.volume * 100));
      } catch (_) {}
    }

    if (this.synthGain) {
      this.synthGain.gain.setValueAtTime(this.volume * 0.25, this.audioCtx?.currentTime || 0);
    }
  }

  public setEqualizer(settings: EqualizerSettings): void {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(settings.bass, now, 0.1);
    }
    if (this.midFilter) {
      this.midFilter.gain.setTargetAtTime(settings.mid, now, 0.1);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(settings.treble, now, 0.1);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.ensureAudioContext();
    return this.analyser;
  }

  // --- High-Fidelity Procedural Web Audio Synthesizer Fallback ---
  // Guarantees music playback anytime remote streams or network are unavailable
  private startSynthFallback(): void {
    if (this.mode === 'synth') return;
    this.mode = 'synth';
    this.isPlaying = true;
    this.callbacks?.onPlayStateChange(true);

    this.ensureAudioContext();
    if (!this.audioCtx) return;

    if (!this.synthGain) {
      this.synthGain = this.audioCtx.createGain();
      this.synthGain.gain.value = this.volume * 0.22;
      this.synthGain.connect(this.audioCtx.destination);
    }

    const bpm = this.currentTrack?.bpm || 105;
    const beatMs = (60 / bpm) * 1000;

    // Harmonic Afrobeat / Lo-fi progression (G minor -> Eb -> Bb -> F)
    const chords = [
      [196.00, 233.08, 293.66], // G minor
      [155.56, 196.00, 233.08], // Eb major
      [116.54, 146.83, 174.61], // Bb major
      [174.61, 220.00, 261.63], // F major
    ];

    let chordIdx = 0;
    let step = 0;

    const playStep = () => {
      if (this.mode !== 'synth' || !this.audioCtx || !this.isPlaying) return;
      const ctx = this.audioCtx;
      const t = ctx.currentTime;

      // Bass & Chords on 4 beat cycle
      if (step % 4 === 0) {
        const chord = chords[chordIdx % chords.length];
        chordIdx++;
        chord.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = i === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.exponentialRampToValueAtTime(0.08 / (i + 1), t + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, t + (beatMs * 3.8) / 1000);

          if (this.synthGain) osc.connect(gain).connect(this.synthGain);
          osc.start(t);
          osc.stop(t + (beatMs * 4) / 1000);
        });
      }

      // Soft bass drum kick on 0 & 2
      if (step % 2 === 0) {
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(110, t);
        kick.frequency.exponentialRampToValueAtTime(32, t + 0.15);

        kickGain.gain.setValueAtTime(0.2, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        if (this.synthGain) kick.connect(kickGain).connect(this.synthGain);
        kick.start(t);
        kick.stop(t + 0.22);
      }

      step++;
    };

    if (this.synthInterval) clearInterval(this.synthInterval);
    this.synthInterval = window.setInterval(playStep, beatMs / 2);

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      if (!this.isPlaying || this.mode !== 'synth') return;
      this.currentTime += 0.25;
      if (this.currentTime >= this.duration) {
        this.currentTime = 0;
        this.callbacks?.onEnded();
      } else {
        this.callbacks?.onTimeUpdate(this.currentTime, this.duration);
      }
    }, 250);
  }

  private pauseSynth(): void {
    this.isPlaying = false;
    this.callbacks?.onPlayStateChange(false);
  }

  private resumeSynth(): void {
    this.isPlaying = true;
    this.callbacks?.onPlayStateChange(true);
  }

  private stopSynth(): void {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public destroy(): void {
    this.stopSynth();
    this.stopYouTubeProgressPolling();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
    if (this.ytPlayer && typeof this.ytPlayer.destroy === 'function') {
      try { this.ytPlayer.destroy(); } catch (_) {}
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
    }
  }
}

export const audioEngine = new AudioEngine();
