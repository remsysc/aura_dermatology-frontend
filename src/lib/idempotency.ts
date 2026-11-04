/**
 * Idempotency-Key lifecycle for `POST /bookings`.
 *
 * The API stores a hash of the request body against the key. Re-sending the *same*
 * payload with the *same* key safely replays the original response (use case: the
 * network dropped after the hold was created). Re-using a key with a *different*
 * payload returns 409 `idempotency_conflict`. So: keep the key while the payload is
 * unchanged, mint a new one the moment it changes.
 */
export interface IdempotencyTracker {
  keyFor(payload: unknown): string;
  reset(): void;
}

export function createIdempotencyTracker(
  generate: () => string = () => crypto.randomUUID(),
): IdempotencyTracker {
  let current: { fingerprint: string; key: string } | null = null;

  return {
    keyFor(payload: unknown): string {
      const fingerprint = JSON.stringify(payload);
      if (current === null || current.fingerprint !== fingerprint) {
        current = { fingerprint, key: generate() };
      }
      return current.key;
    },
    reset(): void {
      current = null;
    },
  };
}
