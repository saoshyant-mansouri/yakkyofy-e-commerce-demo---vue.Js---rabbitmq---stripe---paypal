/**
 * Pings the API until it answers, so the UI can hold a "waking up" splash over a cold start
 * instead of rendering pages whose first requests hang.
 *
 * The API container scales to zero (infra/container_app_api.tf, min_replicas = 0). While it
 * boots, the Vercel proxy either holds the request open or answers 502/503/504, so each attempt
 * has its own timeout and failures are retried with capped exponential backoff inside an overall
 * budget. Time is injectable so the policy can be exercised without real waiting.
 */

export function backoffDelay(attempt, baseDelayMs, maxDelayMs) {
  return Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 1));
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout(signal, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

/**
 * @returns {Promise<{ ok: boolean, attempts: number, elapsedMs: number, error?: string }>}
 */
export async function wakeBackend({
  url,
  fetcher = (...args) => fetch(...args),
  sleep = defaultSleep,
  now = Date.now,
  signal,
  attemptTimeoutMs = 20_000,
  budgetMs = 60_000,
  baseDelayMs = 500,
  maxDelayMs = 4_000,
  onAttempt,
} = {}) {
  const startedAt = now();
  let attempts = 0;
  let lastError = 'No response';

  while (!signal?.aborted) {
    attempts += 1;
    onAttempt?.(attempts, now() - startedAt);
    const timeout = withTimeout(signal, attemptTimeoutMs);
    try {
      const response = await fetcher(url, { cache: 'no-store', credentials: 'omit', signal: timeout.signal });
      if (response.ok) return { ok: true, attempts, elapsedMs: now() - startedAt };
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      if (signal?.aborted) break;
      lastError = error?.name === 'AbortError' ? 'Timed out' : error?.message || String(error);
    } finally {
      timeout.dispose();
    }

    const delay = backoffDelay(attempts, baseDelayMs, maxDelayMs);
    if (now() - startedAt + delay > budgetMs) break;
    await sleep(delay);
  }

  return { ok: false, attempts, elapsedMs: now() - startedAt, error: signal?.aborted ? 'Aborted' : lastError };
}
