import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './styles.css';
import { AudioService } from './game/audio';
import { readSettings } from './game/config';
import { SubmissionService } from './data/submissions';
import { closeDatabase } from './data/database';

const queryClient = new QueryClient();

function bootstrap() {
  const root = document.getElementById('root');
  if (!root) throw new Error('Application root is missing.');

  void import('./mocks/browser')
    .then(({ startMockWorker }) => startMockWorker())
    .catch(() => {});
  const audio = new AudioService(readSettings());
  const submissions = new SubmissionService(queryClient);
  submissions.start();
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      audio.dispose();
      submissions.dispose();
      void closeDatabase();
    });

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App audio={audio} submissions={submissions} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

try {
  bootstrap();
} catch (error: unknown) {
  console.error('Application startup failed.', error);
  const root = document.getElementById('root');
  if (root) {
    root.textContent = 'The application could not start. Reload to try again.';
    root.setAttribute('role', 'alert');
  }
}
