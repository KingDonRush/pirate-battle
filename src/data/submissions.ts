import type { QueryClient } from '@tanstack/react-query';
import { register, retryTransient, retryDelay, ApiError } from './api';
import {
  acknowledge,
  isAcknowledged,
  pendingResults,
  persistResult,
} from './database';
import { completedRecord, type CompletedRecord } from './contracts';
import type { CompletedLocalMatch } from '../game/runtime';
import { scenarios } from '../mocks/scenarios';
export type RegistrationState = Readonly<{
  status: 'saving' | 'pending' | 'error' | 'saved';
  message: string;
}>;
export type SubmissionSnapshot = Readonly<{
  byId: Readonly<Record<string, RegistrationState>>;
  pending: number;
  error: string | null;
}>;
export class SubmissionService {
  private states = new Map<string, RegistrationState>();
  private subscribers = new Set<() => void>();
  private inFlight = new Map<string, Promise<void>>();
  private controllers = new Set<AbortController>();
  private snapshot: SubmissionSnapshot = { byId: {}, pending: 0, error: null };
  private client: QueryClient;
  private unsubscribe: (() => void) | undefined;
  private disposed = false;
  minimumRevision = 0;
  constructor(client: QueryClient) {
    this.client = client;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };
  private publish(error: string | null = this.snapshot.error) {
    this.snapshot = {
      byId: Object.fromEntries(this.states),
      pending: [...this.states.values()].filter((s) => s.status !== 'saved')
        .length,
      error,
    };
    for (const listener of this.subscribers) listener();
  }
  private state(
    id: string,
    status: RegistrationState['status'],
    message: string,
  ) {
    this.states.set(id, { status, message });
    this.publish();
  }
  start() {
    this.unsubscribe ??= scenarios.subscribe(() => {
      if (scenarios.getSnapshot() === 'success') void this.retryAll();
    });
    window.addEventListener('online', this.online);
    void this.restore();
  }
  private online = () => {
    void this.retryAll();
  };
  async restore() {
    try {
      const records = await pendingResults();
      for (const record of records)
        this.state(record.matchId, 'pending', 'Registration pending.');
      this.publish(null);
      for (const record of records) void this.submit(record);
    } catch {
      this.publish(
        'Stored pending matches could not be read. They have not been deleted.',
      );
    }
  }
  async completed(result: CompletedLocalMatch): Promise<void> {
    this.state(result.session.id, 'saving', 'Saving on this device…');
    try {
      const record = await completedRecord(result);
      await persistResult(record);
      this.state(
        record.matchId,
        'pending',
        'Saved on this device. Registration pending.',
      );
      void this.submit(record);
    } catch {
      this.state(
        result.session.id,
        'error',
        'Result could not be stored. Try again.',
      );
    }
  }
  async status(id: string) {
    if (this.states.has(id)) return;
    try {
      if (await isAcknowledged(id)) this.state(id, 'saved', 'Match saved.');
      else this.state(id, 'pending', 'Registration pending.');
    } catch {
      this.state(id, 'error', 'Stored save status could not be read.');
    }
  }
  submit(record: CompletedRecord): Promise<void> {
    const existing = this.inFlight.get(record.matchId);
    if (existing) return existing;
    const controller = new AbortController();
    this.controllers.add(controller);
    this.state(record.matchId, 'saving', 'Saving match…');
    const mutation = this.client.getMutationCache().build(this.client, {
      mutationKey: ['register-match', record.matchId],
      gcTime: 60000,
      mutationFn: (payload: CompletedRecord) =>
        register(payload, controller.signal),
      retry: retryTransient,
      retryDelay,
    });
    const task = mutation
      .execute(record)
      .then(async (acknowledgement) => {
        if (this.disposed) return;
        await acknowledge(acknowledgement.record);
        this.minimumRevision = Math.max(
          this.minimumRevision,
          acknowledgement.revision,
        );
        await Promise.all([
          this.client.cancelQueries({ queryKey: ['ranking'] }),
          this.client.cancelQueries({ queryKey: ['history'] }),
        ]);
        this.state(record.matchId, 'saved', 'Match saved.');
        await Promise.all([
          this.client.invalidateQueries({ queryKey: ['ranking'] }),
          this.client.invalidateQueries({ queryKey: ['history'] }),
        ]);
      })
      .catch((error: unknown) => {
        if (this.disposed) return;
        const message =
          error instanceof ApiError
            ? error.message
            : 'The save acknowledgement could not be stored.';
        this.state(record.matchId, 'error', 'Match not saved. ' + message);
      })
      .finally(() => {
        this.controllers.delete(controller);
        this.inFlight.delete(record.matchId);
      });
    this.inFlight.set(record.matchId, task);
    return task;
  }
  async retryAll() {
    try {
      for (const record of await pendingResults()) void this.submit(record);
    } catch {
      this.publish('Pending matches could not be read. Try again.');
    }
  }
  async retry(id: string, result?: CompletedLocalMatch) {
    try {
      const record = (await pendingResults()).find(
        (item) => item.matchId === id,
      );
      if (record) await this.submit(record);
      else if (result) await this.completed(result);
    } catch {
      this.publish('Stored result could not be retried.');
    }
  }
  cancel() {
    for (const controller of this.controllers) controller.abort();
  }
  async reset() {
    this.cancel();
    await Promise.all([...this.inFlight.values()]);
    this.states.clear();
    this.minimumRevision = 0;
    this.publish(null);
  }
  dispose() {
    this.disposed = true;
    this.cancel();
    this.unsubscribe?.();
    window.removeEventListener('online', this.online);
    this.subscribers.clear();
  }
}
