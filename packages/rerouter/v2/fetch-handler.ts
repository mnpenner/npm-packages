export interface FetchHandler {
    fetch(
        request: Request,
        env: Record<string, unknown>,  // Bun: object (possibly empty)
        ctx?: ExecutionContext         // Cloudflare: provided, Bun: undefined
    ): Response | Promise<Response>;
}

export interface ExecutionContext {
    /**
     * Allows background tasks after response returns.
     */
    waitUntil(promise: Promise<any>): void;

    /**
     * Signal for handling shutdown or draining work (Cloudflare/Bun use this).
     */
    passThroughOnException?(): void;
}
