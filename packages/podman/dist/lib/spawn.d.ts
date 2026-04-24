import type { Readable } from 'node:stream';
export declare function execPodman(args: string[]): Promise<string>;
export declare function execPodmanStreaming(args: string[]): Promise<void>;
export declare function execPodmanStreamingWithStdoutLines(args: string[], onLine: (line: string) => void): Promise<void>;
/**
 * Output handling strategy for spawned processes.
 *
 * @example
 * ```ts
 * import {ProcessOutput} from 'podman'
 *
 * const mode = ProcessOutput.Tee
 * ```
 */
export declare enum ProcessOutput {
    /** Capture output in a stream. */
    Pipe = "pipe",
    /** Discard output. */
    Ignore = "ignore",
    /** Forward output to the parent process. */
    Inherit = "inherit",
    /** Capture output and also forward it to the parent process. */
    Tee = "tee"
}
/**
 * Process output configuration for podman run.
 *
 * @example
 * ```ts
 * import {ProcessOutput} from 'podman'
 *
 * const options = {stdout: ProcessOutput.Tee, stderr: ProcessOutput.Pipe}
 * ```
 */
export type ProcessOptions = {
    /** How stdout is handled. Defaults to [`ProcessOutput.Inherit`]{@link ProcessOutput.Inherit}. */
    stdout?: ProcessOutput;
    /** How stderr is handled. Defaults to [`ProcessOutput.Inherit`]{@link ProcessOutput.Inherit}. */
    stderr?: ProcessOutput;
};
export declare function resolveProcessOutput(mode: ProcessOutput | undefined): ProcessOutputConfig;
/**
 * Handle returned by [`run`]{@link run} to control the podman process.
 *
 * @example
 * ```ts
 * import {run, ProcessOutput} from 'podman'
 *
 * const proc = run(
 *     {image: 'alpine:latest', command: 'echo', commandArgs: ['hello']},
 *     {stdout: ProcessOutput.Tee},
 * )
 * await proc.waitThrow()
 * ```
 */
export type PodmanRunHandle = {
    /**
     * Sends SIGKILL to the podman process.
     *
     * @returns True if the signal was sent, false otherwise.
     *
     * @example
     * ```ts
     * import {run} from 'podman'
     *
     * const proc = await run({image: 'alpine:latest', command: 'sleep', commandArgs: ['60']})
     * proc.kill()
     * ```
     */
    kill: () => boolean;
    /**
     * Sends SIGTERM to the podman process.
     *
     * @returns True if the signal was sent, false otherwise.
     *
     * @example
     * ```ts
     * import {run} from 'podman'
     *
     * const proc = await run({image: 'alpine:latest', command: 'sleep', commandArgs: ['60']})
     * proc.term()
     * ```
     */
    term: () => boolean;
    /**
     * Waits for the podman process to exit.
     *
     * @returns Resolves with the exit code of the podman process.
     *
     * @example
     * ```ts
     * import {run} from 'podman'
     *
     * const proc = await run({image: 'alpine:latest', command: 'true'})
     * const code = await proc.wait()
     * console.log(code)
     * ```
     */
    wait: () => Promise<number>;
    /**
     * Waits for the podman process to exit and rejects on non-zero exit codes.
     *
     * @returns Resolves with the exit code when it is zero.
     *
     * @example
     * ```ts
     * import {run} from 'podman'
     *
     * const proc = await run({image: 'alpine:latest', command: 'false'})
     * await proc.waitThrow()
     * ```
     */
    waitThrow: () => Promise<number>;
    /** Stdout stream when configured with [`ProcessOutput.Pipe`]{@link ProcessOutput.Pipe} or [`ProcessOutput.Tee`]{@link ProcessOutput.Tee}. */
    stdout: Readable | null;
    /** Stderr stream when configured with [`ProcessOutput.Pipe`]{@link ProcessOutput.Pipe} or [`ProcessOutput.Tee`]{@link ProcessOutput.Tee}. */
    stderr: Readable | null;
};
export type ProcessOutputConfig = {
    stdio: 'pipe' | 'ignore' | 'inherit';
    tee: boolean;
};
