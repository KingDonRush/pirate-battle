import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './styles.css';
import { AudioService } from './game/audio';
import { readSettings } from './game/config';

const queryClient = new QueryClient();

async function bootstrap() {
  const root = document.getElementById('root');
  if (!root) throw new Error('Application root is missing.');

  const { startMockWorker } = await import('./mocks/browser');
  void startMockWorker().catch(() => {});
  const audio = new AudioService(readSettings());
  if (import.meta.hot) import.meta.hot.dispose(() => audio.dispose());

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App audio={audio} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap().catch((error: unknown) => {
  console.error('Application startup failed.', error);
  const root = document.getElementById('root');
  if (root) {
    root.textContent = 'The application could not start. Reload to try again.';
    root.setAttribute('role', 'alert');
  }
});
