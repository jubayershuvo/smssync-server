/**
 * With `cacheComponents` Next.js tries to prerender route handlers at build time and
 * aborts them by throwing an internal error as soon as they touch request data
 * (headers, params, ...). A try/catch must NOT swallow that error — call this first
 * in every catch block so Next's own control-flow errors keep propagating.
 */
export function rethrowNext(error: unknown): void {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "")
      : "";
  if (
    digest.startsWith("NEXT_") ||
    digest.startsWith("BAILOUT") ||
    digest === "DYNAMIC_SERVER_USAGE" ||
    digest === "HANGING_PROMISE_REJECTION"
  ) {
    throw error;
  }
}
