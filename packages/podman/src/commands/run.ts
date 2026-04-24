import {ArgBuilder} from '../lib/arg-builder.ts'
import {Process, type ProcessSpawnOptions} from '../lib/process.ts'

type PodmanRunOptions = {
    /** Image to run. */
    image: string
    /** Command to run in the container. */
    command?: string | string[]
    /** Additional arguments to pass to the command. */
    commandArgs?: string[]
    /** Add a custom host-to-IP mapping (host:ip). */
    addHost?: string | string[]
    /** Add annotations to container (key=value). */
    annotation?: string | string[]
    /** Use ARCH instead of the architecture of the machine for choosing images. */
    arch?: string
    /** Attach to STDIN, STDOUT or STDERR. */
    attach?: string | string[]
    /** Path of the authentication file. */
    authfile?: string
    /** Block IO weight (relative weight) accepts a weight value between 10 and 1000. */
    blkioWeight?: string
    /** Block IO weight (relative device weight, format: DEVICE_NAME:WEIGHT). */
    blkioWeightDevice?: string | string[]
    /** Add capabilities to the container. */
    capAdd?: string | string[]
    /** Drop capabilities from the container. */
    capDrop?: string | string[]
    /** Configure cgroup v2 (key=value). */
    cgroupConf?: string | string[]
    /** Optional parent cgroup for the container. */
    cgroupParent?: string
    /** Cgroup namespace to use. */
    cgroupns?: string
    /** Control container cgroup configuration ("enabled"|"disabled"|"no-conmon"|"split"). */
    cgroups?: string
    /** Chroot directories inside the container. */
    chrootdirs?: string | string[]
    /** Write the container ID to the file. */
    cidfile?: string
    /** Limit the CPU CFS (Completely Fair Scheduler) period. */
    cpuPeriod?: number
    /** Limit the CPU CFS (Completely Fair Scheduler) quota. */
    cpuQuota?: number
    /** Limit the CPU real-time period in microseconds. */
    cpuRtPeriod?: number
    /** Limit the CPU real-time runtime in microseconds. */
    cpuRtRuntime?: number
    /** CPU shares (relative weight). */
    cpuShares?: number
    /** Number of CPUs. The default is 0.000 which means no limit. */
    cpus?: number
    /** CPUs in which to allow execution (0-3, 0,1). */
    cpusetCpus?: string
    /** Memory nodes (MEMs) in which to allow execution (0-3, 0,1). Only effective on NUMA systems. */
    cpusetMems?: string
    /** Run container in background and print container ID. */
    detach?: boolean
    /** Override the key sequence for detaching a container. */
    detachKeys?: string
    /** Add a host device to the container. */
    device?: string | string[]
    /** Add a rule to the cgroup allowed devices list. */
    deviceCgroupRule?: string | string[]
    /** Limit read rate (bytes per second) from a device. */
    deviceReadBps?: string | string[]
    /** Limit read rate (IO per second) from a device. */
    deviceReadIops?: string | string[]
    /** Limit write rate (bytes per second) to a device. */
    deviceWriteBps?: string | string[]
    /** Limit write rate (IO per second) to a device. */
    deviceWriteIops?: string | string[]
    /** This is a Docker specific option and is a NOOP. */
    disableContentTrust?: boolean
    /** Set custom DNS servers. */
    dns?: string | string[]
    /** Set custom DNS options. */
    dnsOption?: string | string[]
    /** Set custom DNS search domains. */
    dnsSearch?: string | string[]
    /** Overwrite the default ENTRYPOINT of the image. */
    entrypoint?: string
    /** Set environment variables in container. */
    env?: string | string[]
    /** Read in a file of environment variables. */
    envFile?: string | string[]
    /** Preprocess environment variables from image before injecting them into the container. */
    envMerge?: string | string[]
    /** Expose a port or a range of ports. */
    expose?: string | string[]
    /** GID map to use for the user namespace. */
    gidmap?: string | string[]
    /** GPU devices to add to the container ('all' to pass all GPUs). */
    gpus?: string | string[]
    /** Add additional groups to the primary container process. */
    groupAdd?: string | string[]
    /** Entry to write to /etc/group. */
    groupEntry?: string
    /** Set a healthcheck command for the container ('none' disables the existing healthcheck). */
    healthCmd?: string
    /** Set an interval for the healthcheck. */
    healthInterval?: string
    /** Set the destination of the HealthCheck log. */
    healthLogDestination?: string
    /** Set maximum number of attempts in the HealthCheck log file. */
    healthMaxLogCount?: number
    /** Set maximum length in characters of stored HealthCheck log. */
    healthMaxLogSize?: number
    /** Action to take once the container turns unhealthy. */
    healthOnFailure?: string
    /** The number of retries allowed before a healthcheck is considered to be unhealthy. */
    healthRetries?: number
    /** The initialization time needed for a container to bootstrap. */
    healthStartPeriod?: string
    /** Set a startup healthcheck command for the container. */
    healthStartupCmd?: string
    /** Set an interval for the startup healthcheck. */
    healthStartupInterval?: string
    /** Set the maximum number of retries before the startup healthcheck will restart the container. */
    healthStartupRetries?: number
    /** Set the number of consecutive successes before the startup healthcheck is marked as successful. */
    healthStartupSuccess?: number
    /** Set the maximum amount of time that the startup healthcheck may take before it is considered failed. */
    healthStartupTimeout?: string
    /** The maximum time allowed to complete the healthcheck before an interval is considered failed. */
    healthTimeout?: string
    /** Set container hostname. */
    hostname?: string
    /** Base file to create the /etc/hosts file inside the container, or one of the special values. */
    hostsFile?: string
    /** Host user account to add to /etc/passwd within container. */
    hostuser?: string | string[]
    /** Set proxy environment variables in the container based on the host proxy vars. */
    httpProxy?: boolean
    /** Tells podman how to handle the builtin image volumes ("bind"|"tmpfs"|"ignore"). */
    imageVolume?: string
    /** Run an init binary inside the container that forwards signals and reaps processes. */
    init?: boolean
    /** Path to the container-init binary. */
    initPath?: string
    /** Make STDIN available to the contained process. */
    interactive?: boolean
    /** Specify a static IPv4 address for the container. */
    ip?: string
    /** Specify a static IPv6 address for the container. */
    ip6?: string
    /** IPC namespace to use. */
    ipc?: string
    /** Set metadata on container. */
    label?: string | string[]
    /** Read in a line delimited file of labels. */
    labelFile?: string | string[]
    /** Logging driver for the container. */
    logDriver?: string
    /** Logging driver options. */
    logOpt?: string | string[]
    /** Container MAC address. */
    macAddress?: string
    /** Memory limit (format: <number><unit>). */
    memory?: string
    /** Memory soft limit (format: <number><unit>). */
    memoryReservation?: string
    /** Swap limit equal to memory plus swap: '-1' to enable unlimited swap. */
    memorySwap?: string
    /** Tune container memory swappiness (0 to 100, or -1 for system default). */
    memorySwappiness?: number
    /** Attach a filesystem mount to the container. */
    mount?: string | string[]
    /** Assign a name to the container. */
    name?: string
    /** Connect a container to a network. */
    network?: string | string[]
    /** Add network-scoped alias for the container. */
    networkAlias?: string | string[]
    /** Disable healthchecks on container. */
    noHealthcheck?: boolean
    /** Do not create /etc/hostname within the container, instead use the version from the image. */
    noHostname?: boolean
    /** Do not create /etc/hosts within the container, instead use the version from the image. */
    noHosts?: boolean
    /** Disable OOM Killer. */
    oomKillDisable?: boolean
    /** Tune the host's OOM preferences (-1000 to 1000). */
    oomScoreAdj?: number
    /** Use OS instead of the running OS for choosing images. */
    os?: string
    /** Add entries to /etc/passwd and /etc/group. */
    passwd?: boolean
    /** Entry to write to /etc/passwd. */
    passwdEntry?: string
    /** Configure execution domain using personality (e.g., LINUX/LINUX32). */
    personality?: string
    /** PID namespace to use. */
    pid?: string
    /** Tune container pids limit (set -1 for unlimited). */
    pidsLimit?: number
    /** Specify the platform for selecting the image. */
    platform?: string
    /** Run container in an existing pod. */
    pod?: string
    /** Read the pod ID from the file. */
    podIdFile?: string
    /** Give extended privileges to container. */
    privileged?: boolean
    /** Publish a container's port, or a range of ports, to the host. */
    publish?: string | string[]
    /** Publish all exposed ports to random ports on the host interface. */
    publishAll?: boolean
    /** Pull image policy ("always"|"missing"|"never"|"newer"). */
    pull?: string
    /** Suppress output information when pulling images. */
    quiet?: boolean
    /** Class of Service (COS) that the container should be assigned to. */
    rdtClass?: string
    /** Make containers root filesystem read-only. */
    readOnly?: boolean
    /** When running --read-only containers mount read-write tmpfs on /dev, /dev/shm, /run, /tmp and /var/tmp. */
    readOnlyTmpfs?: boolean
    /** If a container with the same name exists, replace it. */
    replace?: boolean
    /** Add one or more requirement containers that must be started before this container will start. */
    requires?: string | string[]
    /** Restart policy to apply when a container exits. */
    restart?: string
    /** Number of times to retry in case of failure when performing pull. */
    retry?: number
    /** Delay between retries in case of pull failures. */
    retryDelay?: string
    /** Remove container and any anonymous unnamed volume associated with the container after exit. */
    rm?: boolean
    /** Remove image unless used by other containers, implies --rm. */
    rmi?: boolean
    /** The first argument is not an image but the rootfs to the exploded container. */
    rootfs?: boolean
    /** Control sd-notify behavior ("container"|"conmon"|"healthy"|"ignore"). */
    sdnotify?: string
    /** Policy for selecting a seccomp profile (experimental). */
    seccompPolicy?: string
    /** Add secret to container. */
    secret?: string | string[]
    /** Security Options. */
    securityOpt?: string | string[]
    /** Size of /dev/shm (format: <number><unit>). */
    shmSize?: string
    /** Size of systemd specific tmpfs mounts (/run, /run/lock). */
    shmSizeSystemd?: string
    /** Proxy received signals to the process. */
    sigProxy?: boolean
    /** Signal to stop a container. Default is SIGTERM. */
    stopSignal?: string
    /** Timeout (in seconds) that containers stopped by user command have to exit. */
    stopTimeout?: number
    /** Name of range listed in /etc/subgid for use in user namespace. */
    subgidname?: string
    /** Name of range listed in /etc/subuid for use in user namespace. */
    subuidname?: string
    /** Sysctl options. */
    sysctl?: string | string[]
    /** Run container in systemd mode ("true"|"false"|"always"). */
    systemd?: string
    /** Maximum length of time a container is allowed to run. */
    timeout?: number
    /** Require HTTPS and verify certificates when contacting registries for pulling images. */
    tlsVerify?: boolean
    /** Mount a temporary filesystem (tmpfs) into a container. */
    tmpfs?: string
    /** Allocate a pseudo-TTY for container. */
    tty?: boolean
    /** Set timezone in container. */
    tz?: string
    /** UID map to use for the user namespace. */
    uidmap?: string | string[]
    /** Ulimit options. */
    ulimit?: string | string[]
    /** Set umask in container. */
    umask?: string
    /** Unset environment default variables in container. */
    unsetenv?: string | string[]
    /** Unset all default environment variables in container. */
    unsetenvAll?: boolean
    /** Username or UID (format: <name|uid>[:<group|gid>]). */
    user?: string
    /** User namespace to use. */
    userns?: string
    /** UTS namespace to use. */
    uts?: string
    /** Use VARIANT instead of the running architecture variant for choosing images. */
    variant?: string
    /** Bind mount a volume into the container. */
    volume?: string | string[]
    /** Mount volumes from the specified container(s). */
    volumesFrom?: string | string[]
    /** Working directory inside the container. */
    workdir?: string
}

/**
 * Runs a command in a new container.
 *
 * @param options Run options for podman run.
 * @param processOptions Process configuration for stdio, environment, and identity.
 * @returns Spawned [`Process`]{@link Process} for controlling the running podman process.
 *
 * @example
 * ```ts
 * import {run} from 'podman'
 *
 * const proc = run({image: 'alpine:latest', command: 'echo', commandArgs: ['hello from podman']})
 * await proc.waitOrThrow()
 * ```
 *
 * @example
 * ```ts
 * import {run, StreamOut} from 'podman'
 *
 * const proc = run(
 *     {image: 'alpine:latest', command: 'sh', commandArgs: ['-c', 'echo hello; echo err 1>&2']},
 *     {stdout: StreamOut.TEE, stderr: StreamOut.PIPE},
 * )
 * const code = await proc.wait()
 * console.log('exit code:', code)
 * ```
 */
export function run(
    options: PodmanRunOptions,
    processOptions: ProcessSpawnOptions = {},
): Process {
    const args = new ArgBuilder('run')

    args.addValues('--add-host', options.addHost)
    args.addValues('--annotation', options.annotation)
    args.addValue('--arch', options.arch)
    args.addValues('--attach', options.attach)
    args.addValue('--authfile', options.authfile)
    args.addValue('--blkio-weight', options.blkioWeight)
    args.addValues('--blkio-weight-device', options.blkioWeightDevice)
    args.addValues('--cap-add', options.capAdd)
    args.addValues('--cap-drop', options.capDrop)
    args.addValues('--cgroup-conf', options.cgroupConf)
    args.addValue('--cgroup-parent', options.cgroupParent)
    args.addValue('--cgroupns', options.cgroupns)
    args.addValue('--cgroups', options.cgroups)
    args.addValues('--chrootdirs', options.chrootdirs)
    args.addValue('--cidfile', options.cidfile)
    args.addValue('--cpu-period', options.cpuPeriod)
    args.addValue('--cpu-quota', options.cpuQuota)
    args.addValue('--cpu-rt-period', options.cpuRtPeriod)
    args.addValue('--cpu-rt-runtime', options.cpuRtRuntime)
    args.addValue('--cpu-shares', options.cpuShares)
    args.addValue('--cpus', options.cpus)
    args.addValue('--cpuset-cpus', options.cpusetCpus)
    args.addValue('--cpuset-mems', options.cpusetMems)
    args.addBool('--detach', options.detach)
    args.addValue('--detach-keys', options.detachKeys)
    args.addValues('--device', options.device)
    args.addValues('--device-cgroup-rule', options.deviceCgroupRule)
    args.addValues('--device-read-bps', options.deviceReadBps)
    args.addValues('--device-read-iops', options.deviceReadIops)
    args.addValues('--device-write-bps', options.deviceWriteBps)
    args.addValues('--device-write-iops', options.deviceWriteIops)
    args.addBool('--disable-content-trust', options.disableContentTrust)
    args.addValues('--dns', options.dns)
    args.addValues('--dns-option', options.dnsOption)
    args.addValues('--dns-search', options.dnsSearch)
    args.addValue('--entrypoint', options.entrypoint)
    args.addValues('--env', options.env)
    args.addValues('--env-file', options.envFile)
    args.addValues('--env-merge', options.envMerge)
    args.addValues('--expose', options.expose)
    args.addValues('--gidmap', options.gidmap)
    args.addValues('--gpus', options.gpus)
    args.addValues('--group-add', options.groupAdd)
    args.addValue('--group-entry', options.groupEntry)
    args.addValue('--health-cmd', options.healthCmd)
    args.addValue('--health-interval', options.healthInterval)
    args.addValue('--health-log-destination', options.healthLogDestination)
    args.addValue('--health-max-log-count', options.healthMaxLogCount)
    args.addValue('--health-max-log-size', options.healthMaxLogSize)
    args.addValue('--health-on-failure', options.healthOnFailure)
    args.addValue('--health-retries', options.healthRetries)
    args.addValue('--health-start-period', options.healthStartPeriod)
    args.addValue('--health-startup-cmd', options.healthStartupCmd)
    args.addValue('--health-startup-interval', options.healthStartupInterval)
    args.addValue('--health-startup-retries', options.healthStartupRetries)
    args.addValue('--health-startup-success', options.healthStartupSuccess)
    args.addValue('--health-startup-timeout', options.healthStartupTimeout)
    args.addValue('--health-timeout', options.healthTimeout)
    args.addValue('--hostname', options.hostname)
    args.addValue('--hosts-file', options.hostsFile)
    args.addValues('--hostuser', options.hostuser)
    args.addBool('--http-proxy', options.httpProxy)
    args.addValue('--image-volume', options.imageVolume)
    args.addBool('--init', options.init)
    args.addValue('--init-path', options.initPath)
    args.addBool('--interactive', options.interactive)
    args.addValue('--ip', options.ip)
    args.addValue('--ip6', options.ip6)
    args.addValue('--ipc', options.ipc)
    args.addValues('--label', options.label)
    args.addValues('--label-file', options.labelFile)
    args.addValue('--log-driver', options.logDriver)
    args.addValues('--log-opt', options.logOpt)
    args.addValue('--mac-address', options.macAddress)
    args.addValue('--memory', options.memory)
    args.addValue('--memory-reservation', options.memoryReservation)
    args.addValue('--memory-swap', options.memorySwap)
    args.addValue('--memory-swappiness', options.memorySwappiness)
    args.addValues('--mount', options.mount)
    args.addValue('--name', options.name)
    args.addValues('--network', options.network)
    args.addValues('--network-alias', options.networkAlias)
    args.addBool('--no-healthcheck', options.noHealthcheck)
    args.addBool('--no-hostname', options.noHostname)
    args.addBool('--no-hosts', options.noHosts)
    args.addBool('--oom-kill-disable', options.oomKillDisable)
    args.addValue('--oom-score-adj', options.oomScoreAdj)
    args.addValue('--os', options.os)
    args.addBool('--passwd', options.passwd)
    args.addValue('--passwd-entry', options.passwdEntry)
    args.addValue('--personality', options.personality)
    args.addValue('--pid', options.pid)
    args.addValue('--pids-limit', options.pidsLimit)
    args.addValue('--platform', options.platform)
    args.addValue('--pod', options.pod)
    args.addValue('--pod-id-file', options.podIdFile)
    args.addBool('--privileged', options.privileged)
    args.addValues('--publish', options.publish)
    args.addBool('--publish-all', options.publishAll)
    args.addValue('--pull', options.pull)
    args.addBool('--quiet', options.quiet)
    args.addValue('--rdt-class', options.rdtClass)
    args.addBool('--read-only', options.readOnly)
    args.addBool('--read-only-tmpfs', options.readOnlyTmpfs)
    args.addBool('--replace', options.replace)
    args.addValues('--requires', options.requires)
    args.addValue('--restart', options.restart)
    args.addValue('--retry', options.retry)
    args.addValue('--retry-delay', options.retryDelay)
    args.addBool('--rm', options.rm)
    args.addBool('--rmi', options.rmi)
    args.addBool('--rootfs', options.rootfs)
    args.addValue('--sdnotify', options.sdnotify)
    args.addValue('--seccomp-policy', options.seccompPolicy)
    args.addValues('--secret', options.secret)
    args.addValues('--security-opt', options.securityOpt)
    args.addValue('--shm-size', options.shmSize)
    args.addValue('--shm-size-systemd', options.shmSizeSystemd)
    args.addBool('--sig-proxy', options.sigProxy)
    args.addValue('--stop-signal', options.stopSignal)
    args.addValue('--stop-timeout', options.stopTimeout)
    args.addValue('--subgidname', options.subgidname)
    args.addValue('--subuidname', options.subuidname)
    args.addValues('--sysctl', options.sysctl)
    args.addValue('--systemd', options.systemd)
    args.addValue('--timeout', options.timeout)
    args.addBool('--tls-verify', options.tlsVerify)
    args.addValue('--tmpfs', options.tmpfs)
    args.addBool('--tty', options.tty)
    args.addValue('--tz', options.tz)
    args.addValues('--uidmap', options.uidmap)
    args.addValues('--ulimit', options.ulimit)
    args.addValue('--umask', options.umask)
    args.addValues('--unsetenv', options.unsetenv)
    args.addBool('--unsetenv-all', options.unsetenvAll)
    args.addValue('--user', options.user)
    args.addValue('--userns', options.userns)
    args.addValue('--uts', options.uts)
    args.addValue('--variant', options.variant)
    args.addValues('--volume', options.volume)
    args.addValues('--volumes-from', options.volumesFrom)
    args.addValue('--workdir', options.workdir)

    args.add(options.image)

    if(options.command) {
        const commandParts = Array.isArray(options.command) ? options.command : [options.command]
        for(const part of commandParts) {
            args.add(part)
        }
    }
    if(options.commandArgs?.length) {
        for(const part of options.commandArgs) {
            args.add(part)
        }
    }

    return Process.spawn(['podman', ...args.toArgs()], processOptions)
}
