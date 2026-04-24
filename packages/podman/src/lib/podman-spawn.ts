import {promisify} from 'node:util'
import {execFile} from 'node:child_process'
import {createInterface} from 'node:readline'
import {Process, StreamIn, StreamOut} from './process.ts'

const execFileAsync = promisify(execFile)

export async function execPodman(args: string[]): Promise<string> {
    const {stdout} = await execFileAsync('podman', args)
    return stdout
}

export async function execPodmanStreaming(args: string[]): Promise<void> {
    const proc = Process.spawn(['podman', ...args], {
        stdin: StreamIn.INHERIT,
        stdout: StreamOut.INHERIT,
        stderr: StreamOut.INHERIT,
    })
    await proc.waitOrThrow()
}

export async function execPodmanStreamingWithStdoutLines(
    args: string[],
    onLine: (line: string) => void,
): Promise<void> {
    const proc = Process.spawn(['podman', ...args], {
        stdin: StreamIn.EMPTY,
        stdout: StreamOut.TEE,
        stderr: StreamOut.TEE,
    })

    const rl = createInterface({input: proc.stdout, crlfDelay: Infinity})
    rl.on('line', onLine)

    try {
        await proc.waitOrThrow()
    } finally {
        rl.close()
    }
}
