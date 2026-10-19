/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Entry point for the standalone, backend-free build.
 *
 * Identical to `main.tsx` except that it installs the in-browser API first, so
 * the console's `/api/*` calls are answered locally. The normal server build
 * still uses `main.tsx` and is unaffected.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { installBrowserApi } from './lib/browserApi';
import './index.css';

installBrowserApi();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
