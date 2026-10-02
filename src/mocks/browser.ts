import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

const worker = setupWorker(...handlers);

let starting: Promise<void> | undefined;
export function startMockWorker(): Promise<void> {
  starting ??= worker
    .start({
      quiet: true,
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      onUnhandledRequest(request, print) {
        if (new URL(request.url).pathname.startsWith('/api/')) print.error();
      },
    })
    .then(() => {})
    .catch((error: unknown) => {
      starting = undefined;
      throw error;
    });
  return starting;
}

if (import.meta.hot) import.meta.hot.dispose(() => worker.stop());
