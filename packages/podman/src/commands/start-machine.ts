import {execPodman} from '../lib/podman-spawn.ts'

type PodmanMachine = {
    Name: string
    Default: boolean
    Created: string
    Running: boolean
    Starting: boolean
    LastUp: string
    Stream: string
    VMType: string
    CPUs: number
    Memory: string
    Swap: string
    DiskSize: string
    Port: number
    RemoteUsername: string
    IdentityPath: string
    UserModeNetworking: boolean
}

/**
 * Lists Podman machines from `podman machine list --format json`.
 *
 * @returns Resolves with the list of machines.
 *
 * @example
 * ```ts
 * import {listMachines} from 'podman'
 *
 * const machines = await listMachines()
 * console.log(machines.map((machine) => machine.Name))
 * ```
 */
export async function listMachines(): Promise<PodmanMachine[]> {
    const out = await execPodman(['machine', 'list', '--format', 'json'])
    return JSON.parse(out || '[]') as PodmanMachine[]
}

/**
 * Checks whether a Podman machine is currently running.
 *
 * @param machineName Name of the Podman machine to inspect.
 * @returns Resolves to true when the machine is running.
 *
 * @example
 * ```ts
 * import {isMachineRunning} from 'podman'
 *
 * const running = await isMachineRunning()
 * console.log('Machine running:', running)
 * ```
 */
export async function isMachineRunning(machineName = 'podman-machine-default'): Promise<boolean> {
    const machines = await listMachines()
    const m = machines.find((x) => x.Name === machineName)
    if(!m) {
        throw new Error(`Podman machine "${machineName}" not found in list:\n${machines.map((x) => `- ${x.Name}`).join('\n')}`)
    }
    return m.Running
}

/**
 * Starts a Podman machine.
 *
 * @param machineName Name of the Podman machine to start.
 * @returns Resolves when the start command completes.
 *
 * @example
 * ```ts
 * import {startMachine} from 'podman'
 *
 * await startMachine('podman-machine-default')
 * ```
 */
export async function startMachine(machineName = 'podman-machine-default'): Promise<void> {
    await execPodman(['machine', 'start', machineName])
}

/**
 * Starts a Podman machine, ignoring the "already running" error.
 *
 * @param machineName Name of the Podman machine to start.
 * @returns True if the machine was started, false if it was already running.
 *
 * @example
 * ```ts
 * import {forceStartMachine} from 'podman'
 *
 * const started = await forceStartMachine()
 * if (started) {
 *     console.log('Podman machine booted.')
 * }
 * ```
 */
export async function forceStartMachine(machineName = 'podman-machine-default'): Promise<boolean> {
    try {
        await startMachine(machineName)
        return true
    } catch (err) {
        if(isAlreadyRunningError(err)) {
            return false
        }
        throw err
    }
}

function isAlreadyRunningError(err: unknown): boolean {
    if(!err || typeof err !== 'object') {
        return false
    }
    const candidate = err as {stderr?: string; stdout?: string; message?: string}
    const combined = [candidate.stderr, candidate.stdout, candidate.message].filter(Boolean).join('\n')
    return combined.toLowerCase().includes('already running')
}
