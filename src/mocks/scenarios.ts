export const SCENARIOS = {
  success: 'Success',
  empty: 'Empty lists',
  'multiple-pages': 'Multiple pages',
  slow: 'Slow responses',
  variable: 'Variable latency',
  'out-of-order': 'Responses out of order',
  timeout: 'Request timeout',
  connection: 'Connection failure',
  'http-400': 'HTTP 400',
  'http-500': 'HTTP 500',
  'ranking-failure': 'Ranking unavailable',
  'history-failure': 'History unavailable',
  'commit-timeout': 'Commit then timeout',
  'end-unavailable': 'Registration unavailable',
} as const;
export type ScenarioId = keyof typeof SCENARIOS;
export function isScenarioId(value: string): value is ScenarioId {
  return Object.hasOwn(SCENARIOS, value);
}
export class ScenarioController {
  private selected: ScenarioId = 'success';
  private subscribers = new Set<() => void>();
  private counters = new Map<string, number>();
  epoch = 0;
  constructor() {
    try {
      const value = localStorage.getItem('pirate-battle:scenario:v1');
      if (value && isScenarioId(value)) this.selected = value;
    } catch {
      /* Node tests and unavailable optional preferences use success. */
    }
  }
  getSnapshot = () => this.selected;
  subscribe = (listener: () => void) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };
  select(value: ScenarioId) {
    localStorage.setItem('pirate-battle:scenario:v1', value);
    this.selected = value;
    this.counters.clear();
    this.epoch++;
    for (const listener of this.subscribers) listener();
  }
  configure(value: ScenarioId) {
    this.selected = value;
    this.counters.clear();
    this.epoch++;
  }
  plan(endpoint: 'ranking' | 'history' | 'registration') {
    const index = this.counters.get(endpoint) ?? 0;
    this.counters.set(endpoint, index + 1);
    const scenario = this.selected;
    const milliseconds =
      scenario === 'slow'
        ? 1800
        : scenario === 'variable'
          ? ([120, 900, 300, 1500][index % 4] ?? 120)
          : scenario === 'out-of-order'
            ? index % 2 === 0
              ? 1800
              : 100
            : scenario === 'timeout'
              ? 6000
              : 120;
    const status =
      scenario === 'http-400'
        ? 400
        : scenario === 'http-500'
          ? 500
          : (scenario === 'ranking-failure' && endpoint === 'ranking') ||
              (scenario === 'history-failure' && endpoint === 'history') ||
              (scenario === 'end-unavailable' && endpoint === 'registration')
            ? 503
            : 200;
    return {
      scenario,
      index,
      milliseconds,
      status,
      connection: scenario === 'connection',
      epoch: this.epoch,
    };
  }
}
export const scenarios = new ScenarioController();
