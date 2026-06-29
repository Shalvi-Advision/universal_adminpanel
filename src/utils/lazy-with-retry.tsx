import type { ComponentType } from 'react';

import { lazy } from 'react';

/**
 * Wrapper around React.lazy that recovers from "Failed to fetch dynamically
 * imported module" errors.
 *
 * These happen when a new version of the app is deployed: the browser is still
 * running an old index.html that references chunk filenames (e.g.
 * `notifications-71CaLVI4.js`) which no longer exist on the server because the
 * content hashes changed. The dynamic import then 404s.
 *
 * Strategy:
 *  1. Retry the import a couple of times (handles transient network blips and
 *     the brief window during a deploy).
 *  2. If it still fails, force a one-time full page reload so the browser
 *     fetches the fresh index.html with valid chunk names. A sessionStorage
 *     flag prevents an infinite reload loop if the chunk is genuinely missing.
 */
const RELOAD_FLAG_PREFIX = 'lazy-retry-reloaded:';

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /'text\/html' is not a valid JavaScript MIME type/i.test(message)
  );
}

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  retries = 2,
  intervalMs = 500
) {
  return lazy(async () => {
    // Unique key per importer so reloads for different chunks don't clobber.
    const reloadKey = `${RELOAD_FLAG_PREFIX}${importer.toString().length}-${retries}`;

    let attempt = 0;
     
    while (true) {
      try {
        const module = await importer();
        // Successful load: clear any stale reload flag.
        window.sessionStorage.removeItem(reloadKey);
        return module;
      } catch (error) {
        attempt += 1;

        if (attempt <= retries && !isChunkLoadError(error)) {
          // Non-chunk errors: retry briefly, then rethrow.
          await new Promise((resolve) => {
            setTimeout(resolve, intervalMs);
          });
          continue;
        }

        if (attempt <= retries) {
          // Chunk error: short wait then retry (covers the deploy window).
          await new Promise((resolve) => {
            setTimeout(resolve, intervalMs);
          });
          continue;
        }

        // Retries exhausted. For a chunk error, force one full reload to pull
        // the new index.html — but only once, to avoid an infinite loop.
        if (isChunkLoadError(error)) {
          const alreadyReloaded = window.sessionStorage.getItem(reloadKey);
          if (!alreadyReloaded) {
            window.sessionStorage.setItem(reloadKey, '1');
            window.location.reload();
            // Return a never-resolving promise so Suspense holds until reload.
            return new Promise<{ default: T }>(() => {});
          }
        }

        throw error;
      }
    }
  });
}
