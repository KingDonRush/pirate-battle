import type { Settings } from './config';
import oceanUrl from '../../assets/sounds/ocean_ambience_loop.wav?url';
import sailingUrl from '../../assets/sounds/ship_sailing_loop.wav?url';

export class AudioService {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private voices = new Set<AudioBufferSourceNode>();
  private ocean: GainNode | null = null;
  private sailing: GainNode | null = null;
  private owner: string | null = null;
  private loading: Promise<void> | null = null;
  private paused = true;
  private disposed = false;
  error: string | null = null;
  private settings: Settings;
  constructor(settings: Settings) {
    this.settings = settings;
  }
  unlock() {
    if (this.disposed) return;
    try {
      this.context ??= new AudioContext({ latencyHint: 'interactive' });
      if (!this.master) {
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
      }
      this.update(this.settings);
      void this.context.resume().catch(() => {
        this.error = 'Sound is unavailable. You can keep playing.';
      });
      this.loading ??= this.load();
    } catch {
      this.error = 'Sound is unavailable. You can keep playing.';
    }
  }
  private async load() {
    const context = this.context;
    if (!context) return;
    await Promise.allSettled(
      [
        ['ocean', oceanUrl],
        ['sailing', sailingUrl],
      ].map(async (pair) => {
        const name = pair[0],
          url = pair[1];
        if (!name || !url) return;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Sound download failed.');
          const buffer = await context.decodeAudioData(
            await response.arrayBuffer(),
          );
          if (!this.disposed) this.buffers.set(name, buffer);
        } catch {
          this.error = 'Some sounds could not load. You can keep playing.';
        }
      }),
    );
  }
  async begin(owner: string) {
    this.stop();
    this.owner = owner;
    this.paused = false;
    await this.loading;
    if (this.disposed || this.owner !== owner || !this.context || !this.master)
      return;
    const loop = (name: string) => {
      const buffer = this.buffers.get(name);
      if (!buffer || !this.context || !this.master) return null;
      const source = this.context.createBufferSource(),
        gain = this.context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(this.master);
      source.start();
      this.voices.add(source);
      source.onended = () => {
        this.voices.delete(source);
        source.disconnect();
        gain.disconnect();
      };
      return gain;
    };
    this.ocean = loop('ocean');
    this.sailing = loop('sailing');
    this.update(this.settings);
    if (this.paused) this.pause();
    else this.resume();
  }
  update(settings: Settings) {
    this.settings = settings;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(
        settings.muted ? 0 : settings.volume,
        this.context.currentTime,
        0.03,
      );
      this.ocean?.gain.setTargetAtTime(
        settings.ambienceVolume,
        this.context.currentTime,
        0.1,
      );
    }
  }
  movement(moving: boolean) {
    if (this.context)
      this.sailing?.gain.setTargetAtTime(
        moving ? this.settings.ambienceVolume * 0.7 : 0,
        this.context.currentTime,
        0.1,
      );
  }
  pause() {
    this.paused = true;
    void this.context?.suspend().catch(() => {});
  }
  resume() {
    this.paused = false;
    if (this.owner)
      void this.context?.resume().catch(() => {
        this.error = 'Tap a control to enable sound.';
      });
  }
  stop(owner?: string) {
    if (owner && owner !== this.owner) return;
    this.owner = null;
    for (const voice of this.voices) {
      voice.onended = null;
      voice.stop();
      voice.disconnect();
    }
    this.voices.clear();
    this.ocean?.disconnect();
    this.sailing?.disconnect();
    this.ocean = null;
    this.sailing = null;
    this.pause();
  }
  observe() {
    return {
      contexts: Number(this.context !== null),
      voices: this.voices.size,
    };
  }
  dispose() {
    this.disposed = true;
    this.stop();
    this.master?.disconnect();
    this.master = null;
    void this.context?.close().catch(() => {});
    this.context = null;
    this.buffers.clear();
  }
}
