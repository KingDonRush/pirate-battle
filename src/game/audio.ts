import type { Settings } from './config';
import type { CombatEvent } from './simulation';
import oceanUrl from '../../assets/sounds/ocean_ambience_loop.wav?url';
import sailingUrl from '../../assets/sounds/ship_sailing_loop.wav?url';
import fireUrl from '../../assets/sounds/cannon_fire_1.wav?url';
import broadsideUrl from '../../assets/sounds/cannon_broadside.wav?url';
import hitUrl from '../../assets/sounds/ship_wood_hit_1.wav?url';
import explosionUrl from '../../assets/sounds/ship_explosion_1.wav?url';
import waterUrl from '../../assets/sounds/cannonball_water_hit_1.wav?url';
import scoreUrl from '../../assets/sounds/score_point.wav?url';
import lowUrl from '../../assets/sounds/health_low.wav?url';
import warningUrl from '../../assets/sounds/time_warning.wav?url';
import completeUrl from '../../assets/sounds/game_complete.wav?url';
import overUrl from '../../assets/sounds/game_over.wav?url';
const URLS: Record<string, string> = {
  ocean: oceanUrl,
  sailing: sailingUrl,
  front: fireUrl,
  broadside: broadsideUrl,
  'enemy-fire': fireUrl,
  hit: hitUrl,
  damage: hitUrl,
  explosion: explosionUrl,
  water: waterUrl,
  score: scoreUrl,
  'low-health': lowUrl,
  'time-warning': warningUrl,
  complete: completeUrl,
  death: overUrl,
};
type Voice = {
  gain: GainNode;
  owner: string | null;
  loop: boolean;
  priority: number;
};
export class AudioService {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private voices = new Map<AudioBufferSourceNode, Voice>();
  private ocean: GainNode | null = null;
  private sailing: GainNode | null = null;
  private owner: string | null = null;
  private generation = 0;
  private loading: Promise<void> | null = null;
  private abort = new AbortController();
  private paused = true;
  private disposed = false;
  private settings: Settings;
  error: string | null = null;
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
    const byUrl = new Map<string, Promise<AudioBuffer>>();
    await Promise.allSettled(
      Object.entries(URLS).map(async ([name, url]) => {
        try {
          let task = byUrl.get(url);
          if (!task) {
            task = fetch(url, { signal: this.abort.signal }).then(
              async (response) => {
                if (!response.ok) throw new Error('Sound download failed.');
                return context.decodeAudioData(await response.arrayBuffer());
              },
            );
            byUrl.set(url, task);
          }
          const buffer = await task;
          if (!this.disposed) this.buffers.set(name, buffer);
        } catch {
          if (!this.disposed)
            this.error = 'Some sounds could not load. You can keep playing.';
        }
      }),
    );
  }
  private source(
    name: string,
    owner: string | null,
    loop: boolean,
    priority: number,
  ): GainNode | null {
    const context = this.context,
      buffer = this.buffers.get(name);
    if (!context || !buffer || !this.master || this.disposed) return null;
    if (
      !loop &&
      [...this.voices.values()].filter((v) => !v.loop).length >= 12
    ) {
      const victim = [...this.voices.entries()].find(
        ([, voice]) => !voice.loop && voice.priority <= priority,
      );
      if (!victim) return null;
      this.remove(victim[0], victim[1]);
    }
    const source = context.createBufferSource(),
      gain = context.createGain();
    source.buffer = buffer;
    source.loop = loop;
    gain.gain.value = loop
      ? 0
      : this.settings.effectsVolume *
        (name === 'enemy-fire' ? 0.4 : name === 'water' ? 0.35 : 0.8);
    source.connect(gain);
    gain.connect(this.master);
    const voice = { gain, owner, loop, priority };
    this.voices.set(source, voice);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start();
    return gain;
  }
  private remove(source: AudioBufferSourceNode, voice: Voice) {
    source.onended = null;
    source.stop();
    source.disconnect();
    voice.gain.disconnect();
    this.voices.delete(source);
  }
  async begin(owner: string) {
    this.stop();
    this.owner = owner;
    this.paused = false;
    const generation = ++this.generation;
    await this.loading;
    if (this.disposed || this.owner !== owner || generation !== this.generation)
      return;
    this.ocean = this.source('ocean', owner, true, 0);
    this.sailing = this.source('sailing', owner, true, 0);
    this.update(this.settings);
    if (this.paused) this.pause();
    else this.resume();
  }
  effect(kind: CombatEvent['kind'], owner: string) {
    if (this.paused || owner !== this.owner || this.settings.muted) return;
    const priority = ['low-health', 'explosion', 'time-warning'].includes(kind)
      ? 3
      : kind === 'hit' || kind === 'damage'
        ? 2
        : 1;
    this.source(kind, owner, false, priority);
  }
  result(reason: 'time' | 'death') {
    if (this.settings.muted) return;
    void this.context
      ?.resume()
      .then(() => {
        if (!this.disposed)
          this.source(reason === 'time' ? 'complete' : 'death', null, false, 4);
      })
      .catch(() => {});
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
        this.error = 'Tap Play or Resume to enable sound.';
      });
  }
  stop(owner?: string) {
    if (owner && owner !== this.owner) return;
    this.generation++;
    for (const [source, voice] of this.voices)
      if (!owner || voice.owner === owner) this.remove(source, voice);
    this.owner = null;
    this.ocean = null;
    this.sailing = null;
    this.pause();
  }
  observe() {
    return {
      contexts: Number(this.context !== null),
      voices: this.voices.size,
      loops: [...this.voices.values()].filter((v) => v.loop).length,
      state: this.context?.state,
    };
  }
  dispose() {
    this.disposed = true;
    this.abort.abort();
    this.stop();
    this.master?.disconnect();
    this.master = null;
    void this.context?.close().catch(() => {});
    this.context = null;
    this.buffers.clear();
  }
}
