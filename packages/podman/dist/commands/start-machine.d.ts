type PodmanMachine = {
    Name: string;
    Default: boolean;
    Created: string;
    Running: boolean;
    Starting: boolean;
    LastUp: string;
    Stream: string;
    VMType: string;
    CPUs: number;
    Memory: string;
    Swap: string;
    DiskSize: string;
    Port: number;
    RemoteUsername: string;
    IdentityPath: string;
    UserModeNetworking: boolean;
};
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
export declare function listMachines(): Promise<PodmanMachine[]>;
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
export declare function isMachineRunning(machineName?: string): Promise<boolean>;
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
export declare function startMachine(machineName?: string): Promise<void>;
/**
 * Starts a Podman machine, ignoring the "already running" error.
 *
 * @param machineName Name of the Podman machine to start.
 * @returns Resolves to true when a start was triggered, or false when it was already running.
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
export declare function forceStartMachine(machineName?: string): Promise<boolean>;
export {};
