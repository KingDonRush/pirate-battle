import axios from 'axios';
import {
  canonical,
  decodePage,
  decodeRecord,
  type CompletedRecord,
  type PageResult,
} from './contracts';

export class ApiError extends Error {
  readonly kind: 'timeout' | 'connection' | 'http' | 'cancelled' | 'payload';
  readonly status: number | null;
  constructor(
    message: string,
    kind: ApiError['kind'],
    status: number | null = null,
  ) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}
const http = axios.create({
  baseURL: '/api',
  timeout: 4000,
  transitional: { clarifyTimeoutError: true },
});
function classify(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error))
    return new ApiError('Request cancelled.', 'cancelled');
  if (axios.isAxiosError(error)) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED')
      return new ApiError(
        'The service took too long to respond. Try again.',
        'timeout',
      );
    if (error.response)
      return new ApiError(
        error.response.status === 409
          ? 'This match ID has a conflicting result.'
          : 'The service could not complete the request. Try again.',
        'http',
        error.response.status,
      );
    return new ApiError(
      'The service could not be reached. Try again.',
      'connection',
    );
  }
  return new ApiError('The service returned invalid data.', 'payload');
}
async function ready() {
  try {
    const { startMockWorker } = await import('../mocks/browser');
    await startMockWorker();
  } catch {
    throw new ApiError(
      'The demo service could not start. Reload or try again.',
      'connection',
    );
  }
}
export async function ranking(
  ruleset: string,
  page: number,
  signal: AbortSignal,
): Promise<PageResult> {
  try {
    await ready();
    const response = await http.get<unknown>('/ranking', {
      params: { rulesetId: ruleset, page, pageSize: 5 },
      signal,
    });
    return decodePage(response.data);
  } catch (error) {
    throw classify(error);
  }
}
export async function history(
  playerId: string,
  page: number,
  signal: AbortSignal,
): Promise<PageResult> {
  try {
    await ready();
    const response = await http.get<unknown>(
      '/players/' + encodeURIComponent(playerId) + '/matches',
      { params: { page, pageSize: 5 }, signal },
    );
    return decodePage(response.data);
  } catch (error) {
    throw classify(error);
  }
}
export async function register(
  record: CompletedRecord,
  signal: AbortSignal,
): Promise<{ record: CompletedRecord; revision: number }> {
  try {
    await ready();
    const response = await http.post<unknown>('/matches', record, { signal });
    const body = response.data;
    if (
      typeof body !== 'object' ||
      body === null ||
      !('record' in body) ||
      !('revision' in body) ||
      typeof body.revision !== 'number' ||
      !Number.isSafeInteger(body.revision) ||
      body.revision < 0
    )
      throw new ApiError('Invalid registration response.', 'payload');
    const stored = decodeRecord(body.record);
    if (canonical(stored) !== canonical(record))
      throw new ApiError(
        'The acknowledgement did not match this result.',
        'payload',
      );
    return { record: stored, revision: body.revision };
  } catch (error) {
    throw classify(error);
  }
}
export function transient(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.kind === 'timeout' ||
      error.kind === 'connection' ||
      (error.kind === 'http' && (error.status ?? 0) >= 500))
  );
}
export const retryTransient = (failureCount: number, error: unknown) =>
  failureCount < 2 && transient(error);
export const retryDelay = (attempt: number) =>
  Math.min(2000, 1000 * (attempt + 1));
