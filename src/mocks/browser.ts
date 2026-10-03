import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

const worker = setupWorker(...handlers);

// This locked worker transfers separate request/response clones for lifecycle
// observation. Quiet mode leaves their streams unconsumed. Release only those
// observational branches; Axios/assets consume the original network bodies.
function releaseObservation({
  request,
  response,
}: {
  request: Request;
  response: Response;
}) {
  for (const copy of [request, response])
    if (copy.body && !copy.bodyUsed && !copy.body.locked)
      void copy.body.cancel().catch(() => {});
}
worker.events.on('response:mocked', releaseObservation);
worker.events.on('response:bypass', releaseObservation);

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

if (import.meta.hot)
  import.meta.hot.dispose(() => {
    worker.events.removeListener('response:mocked', releaseObservation);
    worker.events.removeListener('response:bypass', releaseObservation);
    worker.stop();
  });
