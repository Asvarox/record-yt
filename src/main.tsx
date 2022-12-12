import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as Sentry from '@sentry/react';
import isDev from 'utils/isDev';
import isE2E from 'utils/isE2E';

if (import.meta.env.VITE_APP_SENTRY_DSN_URL) {
  Sentry.init({
    dsn: import.meta.env.VITE_APP_SENTRY_DSN_URL,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    environment: isDev() ? 'development' : isE2E() ? 'e2e' : 'production',
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
