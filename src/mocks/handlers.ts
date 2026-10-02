import type { RequestHandler } from 'msw';

// Ranking and match history handlers will be shared by browser and Node tests.
export const handlers: RequestHandler[] = [];
