import {describe, expect, test} from 'bun:test'
import {Process, StreamIn, StreamOut} from './process.ts'
import {Readable} from 'node:stream'

const decoder = new TextDecoder()

const SHELL = process.env.SHELL ?? '/bin/sh'

async function readStream(stream: Readable): Promise<string> {
    const chunks: Buffer[] = []
    return await new Promise((resolve, reject) => {
        stream.on('data', (chunk) => {
            chunks.push(Buffer.from(chunk as Buffer))
        })
        stream.on('error', reject)
        stream.on('end', () => {
            resolve(decoder.decode(Buffer.concat(chunks)))
        })
    })
}

async function readStdinLink(mode: StreamIn): Promise<string> {
    const proc = Process.spawn([
        SHELL,
        '-c',
        'if [ -e /proc/self/fd/0 ]; then readlink /proc/self/fd/0; else echo "no-proc"; fi',
    ], {
        stdin: mode,
        stdout: StreamOut.PIPE,
    })

    const output = await readStream(proc.stdout)
    await proc.wait()
    return output.trim()
}

describe('Process', () => {
    test('spawns and captures stdout/stderr with data events', async () => {
        const proc = Process.spawn([SHELL, '-c', 'echo out; echo err 1>&2'], {
            stdout: StreamOut.PIPE,
            stderr: StreamOut.PIPE,
        })

        let stdout = ''
        let stderr = ''
        proc.on('data', (chunk, fd) => {
            const text = decoder.decode(chunk)
            if(fd === 1) {
                stdout += text
            } else {
                stderr += text
            }
        })

        const code = await proc.wait()
        expect(code).toBe(0)
        expect(stdout).toBe('out\n')
        expect(stderr).toBe('err\n')
    })

    test('stdin pipe writes through to the child process', async () => {
        const proc = Process.spawn([SHELL, '-c', 'read -r line; printf "%s" "$line"'], {
            stdin: StreamIn.PIPE,
            stdout: StreamOut.PIPE,
            stderr: StreamOut.PIPE,
        })

        proc.stdin.write('hello')
        proc.stdin.end('\n')

        const output = await readStream(proc.stdout)
        const code = await proc.wait()

        expect(code).toBe(0)
        expect(output).toBe('hello')
    })

    test('StreamIn.EMPTY attaches /dev/null to stdin', async () => {
        const proc = Process.spawn([SHELL, '-c', 'if read -r line; then echo "read:$line"; else echo "eof"; fi'], {
            stdin: StreamIn.EMPTY,
            stdout: StreamOut.PIPE,
        })

        let sawError = false
        proc.stdin.on('error', () => {
            sawError = true
        })

        proc.stdin.write('discarded')
        proc.stdin.end()

        const output = await readStream(proc.stdout)
        const code = await proc.wait()
        expect(code).toBe(0)
        expect(sawError).toBe(false)
        expect(output.trim()).toBe('eof')
    })

    test('StreamIn.EMPTY keeps stdin open as /dev/null', async () => {
        const link = await readStdinLink(StreamIn.EMPTY)
        if(link === 'no-proc') {
            return
        }
        expect(link).toBe('/dev/null')
    })

    test('env replaces process.env', async () => {
        const previous = process.env.PROC_TEST_PARENT
        process.env.PROC_TEST_PARENT = 'present'
        try {
            const proc = Process.spawn([
                SHELL,
                '-c',
                'printf "%s|%s" "$FOO" "$PROC_TEST_PARENT"',
            ], {
                stdout: StreamOut.PIPE,
                env: {FOO: 'bar'},
            })

            const output = await readStream(proc.stdout)
            const code = await proc.wait()

            expect(code).toBe(0)
            expect(output).toBe('bar|')
        } finally {
            if(previous === undefined) {
                delete process.env.PROC_TEST_PARENT
            } else {
                process.env.PROC_TEST_PARENT = previous
            }
        }
    })

    test('waitOrThrow resolves with void on success', async () => {
        const proc = Process.spawn([SHELL, '-c', 'exit 0'])

        const result = await proc.waitOrThrow()
        expect(result).toBeUndefined()
    })

    test('waitOrThrow rejects on non-zero exit codes', async () => {
        const proc = Process.spawn([SHELL, '-c', 'exit 3'])

        expect(proc.waitOrThrow()).rejects.toThrow('process exited with code 3')
    })

    test('wait timeout kills the process', async () => {
        const proc = Process.spawn([SHELL, '-c', 'sleep 5'])

        const code = await proc.wait(50)
        expect(code).not.toBe(0)
    })

    test('StreamOut.DISCARD produces no data', async () => {
        const proc = Process.spawn([SHELL, '-c', 'echo discard'], {
            stdout: StreamOut.DISCARD,
        })

        let sawData = false
        proc.on('data', () => {
            sawData = true
        })

        const code = await proc.wait()
        expect(code).toBe(0)
        expect(sawData).toBe(false)
    })

    test('StreamOut.CLOSE closes the parent read end for stdout', async () => {
        const proc = Process.spawn([SHELL, '-c', 'printf "x"'], {
            stdout: StreamOut.CLOSE,
        })

        let sawData = false
        proc.on('data', () => {
            sawData = true
        })

        await new Promise((resolve) => setImmediate(resolve))
        expect(proc.stdout.destroyed).toBe(true)

        await proc.wait(1000)
        expect(sawData).toBe(false)
    })

    test('StreamOut.CLOSE closes the parent read end for stderr', async () => {
        const proc = Process.spawn([SHELL, '-c', 'printf "x" 1>&2'], {
            stderr: StreamOut.CLOSE,
        })

        let sawData = false
        proc.on('data', () => {
            sawData = true
        })

        await new Promise((resolve) => setImmediate(resolve))
        expect(proc.stderr.destroyed).toBe(true)

        await proc.wait(1000)
        expect(sawData).toBe(false)
    })
})
