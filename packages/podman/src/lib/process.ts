import {spawn, type ChildProcess} from 'node:child_process'
import type {TypedEventEmitter} from './typed-event-emitter.ts'
import {EventEmitter} from 'node:events'
import {Readable, Writable} from 'node:stream'

/**
 * Configuration for [`Process.spawn`]{@link Process.spawn}.
 *
 * @example
 * ```ts
 * import {Process, StreamIn, StreamOut} from 'podman'
 *
 * const proc = Process.spawn(['echo', 'hi'], {
 *     stdin: StreamIn.EMPTY,
 *     stdout: StreamOut.TEE,
 *     stderr: StreamOut.PIPE,
 * })
 * await proc.wait()
 * ```
 */
export type ProcessSpawnOptions = {
    /** How the child process reads input. Defaults to [`StreamIn.INHERIT`]{@link StreamIn.INHERIT}. */
    stdin?: StreamIn
    /** How the child process writes stdout. Defaults to [`StreamOut.INHERIT`]{@link StreamOut.INHERIT}. */
    stdout?: StreamOut
    /** How the child process writes stderr. Defaults to [`StreamOut.INHERIT`]{@link StreamOut.INHERIT}. */
    stderr?: StreamOut
    /** Environment variables to use for the child process (replaces the current process environment). */
    env?: Record<string, string>
    /** User ID to run the process as. */
    uid?: number
    /** Group ID to run the process as. */
    gid?: number
    /** Working directory for the process. */
    cwd?: string
}

type OneOrMore<T> = [T, ...T[]];

type Events = {
    /**
     * Data from either stdout or stderr.
     */
    data: (chunk: Buffer, fd: 1|2) => void,
}

const DEV_NULL = new Writable({
    write(_c, _e, cb) { cb(); },
});

type StreamInConfig = {
    stdio: 'pipe' | 'ignore' | 'inherit' | Readable
}

type StreamOutConfig = {
    stdio: 'pipe' | 'ignore' | 'inherit' | Writable
    tee: boolean
    closeAfterSpawn: boolean
}

/**
 * Spawn and control a child process with typed events and stream helpers.
 *
 * @example
 * ```ts
 * import {Process, StreamIn, StreamOut} from 'podman'
 *
 * const proc = Process.spawn(['echo', 'hello'], {
 *     stdin: StreamIn.EMPTY,
 *     stdout: StreamOut.TEE,
 *     stderr: StreamOut.PIPE,
 * })
 * proc.on('data', (chunk, fd) => {
 *     console.log(fd === 1 ? 'stdout:' : 'stderr:', chunk.toString('utf8'))
 * })
 * const code = await proc.wait()
 * console.log('exit code:', code)
 * ```
 */
export class Process extends (EventEmitter as new () => TypedEventEmitter<Events>) {
    private readonly _child: ChildProcess
    private readonly _exitPromise: Promise<number>
    public readonly stdin: Writable
    public readonly stdout: Readable
    public readonly stderr: Readable

    private constructor(proc: ChildProcess) {
        super()
        this._child = proc
        this.stdout = proc.stdout ?? Readable.from([]);
        this.stderr = proc.stderr ?? Readable.from([]);
        this.stdin = proc.stdin ?? DEV_NULL
        this._exitPromise = new Promise<number>((resolve, reject) => {
            proc.once('error', reject)
            proc.once('close', (code) => {
                resolve(code ?? 1)
            })
        })
    }

    /**
     * Spawn a child process.
     *
     * @param cmd Command name followed by optional arguments.
     * @param options Process configuration for stdio, environment, and identity.
     * @returns The spawned [`Process`]{@link Process} instance.
     *
     * @example
     * ```ts
     * import {Process, StreamIn, StreamOut} from 'podman'
     *
 * const proc = Process.spawn(['podman', '--version'], {
 *     stdin: StreamIn.EMPTY,
 *     stdout: StreamOut.PIPE,
 *     stderr: StreamOut.TEE,
 * })
     * const code = await proc.wait()
     * console.log('exit code:', code)
     * ```
     */
    static spawn(cmd: OneOrMore<string>, options: ProcessSpawnOptions = {}): Process {
        const [command, ...args] = cmd

        const stdinConfig = resolveStreamIn(options.stdin)
        const stdoutConfig = resolveStreamOut(options.stdout)
        const stderrConfig = resolveStreamOut(options.stderr)

        const child = spawn(command, args, {
            stdio: [stdinConfig.stdio, stdoutConfig.stdio, stderrConfig.stdio],
            env: options.env ?? process.env,
            uid: options.uid,
            gid: options.gid,
            cwd: options.cwd,
        })

        const proc = new Process(child)

        if(stdoutConfig.closeAfterSpawn) {
            child.stdout?.destroy()
        } else {
            attachOutput(proc, child.stdout, 1, stdoutConfig.tee)
        }

        if(stderrConfig.closeAfterSpawn) {
            child.stderr?.destroy()
        } else {
            attachOutput(proc, child.stderr, 2, stderrConfig.tee)
        }

        return proc

    }

    /**
     * Send SIGKILL signal to the process.
     *
     * @returns The current [`Process`]{@link Process} instance.
     *
     * @example
     * ```ts
     * import {Process} from 'podman'
     *
     * const proc = Process.spawn(['sleep', '60'])
     * proc.kill()
     * ```
     */
    kill(): this {
        this._child.kill('SIGKILL')
        return this
    }

    /**
     * Send SIGTERM signal to the process.
     *
     * @returns The current [`Process`]{@link Process} instance.
     *
     * @example
     * ```ts
     * import {Process} from 'podman'
     *
     * const proc = Process.spawn(['sleep', '60'])
     * proc.term()
     * ```
     */
    term(): this {
        this._child.kill('SIGTERM')
        return this
    }

    /**
     * Wait for the process to terminate.
     *
     * If a timeout is provided, the process will be forcefully killed if it has not gracefully exited within the
     * timeout period.
     *
     * @param timeoutMs Milliseconds to wait before sending SIGKILL.
     * @returns Exit code of the process.
     *
     * @example
     * ```ts
     * import {Process} from 'podman'
     *
     * const proc = Process.spawn(['echo', 'hello'])
     * const code = await proc.wait()
     * console.log(code)
     * ```
     *
     * @example
     * ```ts
     * import {Process} from 'podman'
     *
     * const proc = Process.spawn(['sleep', '10'])
     * const code = await proc.wait(1000)
     * console.log(code)
     * ```
     */
    wait(timeoutMs?: number): Promise<number> {
        if(timeoutMs === undefined) {
            return this._exitPromise
        }

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this._child.kill('SIGKILL')
            }, timeoutMs)

            this._exitPromise
                .then((code) => {
                    clearTimeout(timer)
                    resolve(code)
                })
                .catch((err) => {
                    clearTimeout(timer)
                    reject(err)
                })
        })
    }

    /**
     * Wait for the process to terminate. If it returns a non-zero exit code, reject.
     *
     * If a timeout is provided, the process will be forcefully killed if it has not gracefully exited within the
     * timeout period.
     *
     * @param timeoutMs Milliseconds to wait before sending SIGKILL.
     * @returns Resolves when the process exits with code 0.
     *
     * @example
     * ```ts
     * import {Process} from 'podman'
     *
     * const proc = Process.spawn(['true'])
     * await proc.waitOrThrow()
     * ```
     *
     * @example
     * ```ts
     * import {Process} from 'podman'
     *
     * const proc = Process.spawn(['false'])
     * await proc.waitOrThrow(500)
     * ```
     */
    async waitOrThrow(timeoutMs?: number): Promise<void> {
        const code = await this.wait(timeoutMs)
        if(code !== 0) {
            throw new Error(`process exited with code ${code}`)
        }
    }
}

/**
 * Input handling strategy for spawned processes.
 *
 * @example
 * ```ts
 * import {StreamIn} from 'podman'
 *
 * const stdinMode = StreamIn.INHERIT
 * ```
 */
export const enum StreamIn {
    /**
     * Attach `/dev/null` to the child's stdin (EOF immediately).
     * Writes to stdin will be silently discarded.
     */
    EMPTY,
    /**
     * Child reads from the parent process's stdin.
     * Writes to stdin will be silently discarded.
     */
    INHERIT,
    /**
     * Expose a writable so the parent can write to the child's stdin.
     */
    PIPE,
}

/**
 * Output handling strategy for spawned processes.
 *
 * @example
 * ```ts
 * import {StreamOut} from 'podman'
 *
 * const stdoutMode = StreamOut.TEE
 * ```
 */
export const enum StreamOut {
    /** Drain and discard all output (connect to `/dev/null`). */
    DISCARD,
    /** Close the parent's read end so child writes can fail (SIGPIPE/EPIPE). */
    CLOSE,
    /** Child writes to the parent process's stdout/stderr. */
    INHERIT,
    /** Expose a readable so the parent can consume the child's output. */
    PIPE,
    /** Forward to parent and also expose a readable copy. */
    TEE,
}

function resolveStreamIn(mode: StreamIn | undefined): StreamInConfig {
    switch(mode ?? StreamIn.INHERIT) {
        case StreamIn.EMPTY:
            return {stdio: 'ignore'}
        case StreamIn.INHERIT:
            return {stdio: 'inherit'}
        case StreamIn.PIPE:
            return {stdio: 'pipe'}
    }
}

function resolveStreamOut(mode: StreamOut | undefined): StreamOutConfig {
    switch(mode ?? StreamOut.INHERIT) {
        case StreamOut.DISCARD:
            return {stdio: 'ignore', tee: false, closeAfterSpawn: false}
        case StreamOut.CLOSE:
            return {stdio: 'pipe', tee: false, closeAfterSpawn: true}
        case StreamOut.INHERIT:
            return {stdio: 'inherit', tee: false, closeAfterSpawn: false}
        case StreamOut.PIPE:
            return {stdio: 'pipe', tee: false, closeAfterSpawn: false}
        case StreamOut.TEE:
            return {stdio: 'pipe', tee: true, closeAfterSpawn: false}
    }
}

function attachOutput(proc: Process, stream: Readable | null, fd: 1 | 2, tee: boolean): void {
    if(!stream) {
        return
    }

    stream.on('data', (chunk) => {
        proc.emit('data', chunk as Buffer, fd)
        if(tee) {
            if(fd === 1) {
                process.stdout.write(chunk)
            } else {
                process.stderr.write(chunk)
            }
        }
    })
}
