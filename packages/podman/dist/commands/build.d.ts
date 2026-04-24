type PodmanBuildOptions = {
    /** Build context directory. */
    context?: string;
    /** Add a custom host-to-IP mapping (host:ip). */
    addHost?: string | string[];
    /** Attempt to build for all base image platforms. */
    allPlatforms?: boolean;
    /** Set metadata for an image. */
    annotation?: string | string[];
    /** Set the ARCH of the image to the provided value instead of the architecture of the host. */
    arch?: string;
    /** Path of the authentication file. */
    authfile?: string;
    /** Argument=value to supply to the builder. */
    buildArg?: string | string[];
    /** Argfile.conf containing lines of argument=value to supply to the builder. */
    buildArgFile?: string;
    /** Argument=value to supply additional build context to the builder. */
    buildContext?: string | string[];
    /** Remote repository list to utilise as potential cache source. */
    cacheFrom?: string | string[];
    /** Remote repository list to utilise as potential cache destination. */
    cacheTo?: string | string[];
    /** Only consider cache images under specified duration. */
    cacheTtl?: string;
    /** Add the specified capability when running. */
    capAdd?: string | string[];
    /** Drop the specified capability when running. */
    capDrop?: string | string[];
    /** Use certificates at the specified path to access the registry. */
    certDir?: string;
    /** Optional parent cgroup for the container. */
    cgroupParent?: string;
    /** 'private', or 'host'. */
    cgroupns?: string;
    /** Preserve the contents of VOLUMEs during RUN instructions. */
    compatVolumes?: boolean;
    /** Set additional flag to pass to C preprocessor (cpp). */
    cppFlag?: string | string[];
    /** Limit the CPU CFS (Completely Fair Scheduler) period. */
    cpuPeriod?: number;
    /** Limit the CPU CFS (Completely Fair Scheduler) quota. */
    cpuQuota?: number;
    /** CPU shares (relative weight). */
    cpuShares?: number;
    /** CPUs in which to allow execution (0-3, 0,1). */
    cpusetCpus?: string;
    /** Memory nodes (MEMs) in which to allow execution (0-3, 0,1). Only effective on NUMA systems. */
    cpusetMems?: string;
    /** Set an "org.opencontainers.image.created" annotation in the image. */
    createdAnnotation?: boolean;
    /** Use username[:password] for accessing the registry. */
    creds?: string;
    /** Key needed to decrypt the image. */
    decryptionKey?: string | string[];
    /** Additional devices to provide. */
    device?: string | string[];
    /** Do not compress layers by default. */
    disableCompression?: boolean;
    /** Set custom DNS servers or disable it completely by setting it to 'none'. */
    dns?: string;
    /** Set custom DNS options. */
    dnsOption?: string | string[];
    /** Set custom DNS search domains. */
    dnsSearch?: string | string[];
    /** Set environment variable for the image. */
    env?: string | string[];
    /** Pathname or URL of a Dockerfile. */
    file?: string;
    /** Always remove intermediate containers after a build, even if the build is unsuccessful. */
    forceRm?: boolean;
    /** Format of the built image's manifest and metadata. */
    format?: string;
    /** Image name used to replace the value in the first FROM instruction in the Containerfile. */
    from?: string;
    /** Add additional groups to the primary container process. */
    groupAdd?: string | string[];
    /** Set the OCI hooks directory path (may be set multiple times). */
    hooksDir?: string | string[];
    /** Pass through HTTP Proxy environment variables. */
    httpProxy?: boolean;
    /** Add default identity label. */
    identityLabel?: boolean;
    /** Path to an alternate .dockerignore file. */
    ignorefile?: string;
    /** File to write the image ID to. */
    iidfile?: string;
    /** Inherit the annotations from the base image or base stages. */
    inheritAnnotations?: boolean;
    /** Inherit the labels from the base image or base stages. */
    inheritLabels?: boolean;
    /** 'private', path of IPC namespace to join, or 'host'. */
    ipc?: string;
    /** Type of process isolation to use. */
    isolation?: string;
    /** How many stages to run in parallel. */
    jobs?: number;
    /** Set metadata for an image. */
    label?: string | string[];
    /** Set metadata for an intermediate image. */
    layerLabel?: string | string[];
    /** Use intermediate layers during build. */
    layers?: boolean;
    /** Log to file instead of stdout/stderr. */
    logfile?: string;
    /** Add the image to the specified manifest list. */
    manifest?: string;
    /** Memory limit (format: <number><unit>, where unit = b, k, m or g). */
    memory?: string;
    /** Swap limit equal to memory plus swap: '-1' to enable unlimited swap. */
    memorySwap?: string;
    /** 'private', 'none', 'ns:path' of network namespace to join, or 'host'. */
    network?: string;
    /** Do not use existing cached images for the container build. */
    noCache?: boolean;
    /** Do not create new /etc/hostname file for RUN instructions, use the one from the base image. */
    noHostname?: boolean;
    /** Do not create new /etc/hosts file for RUN instructions, use the one from the base image. */
    noHosts?: boolean;
    /** Omit build history information from built image. */
    omitHistory?: boolean;
    /** Set the OS to the provided value instead of the current operating system of the host. */
    os?: string;
    /** Set required OS feature for the target image in addition to values from the base image. */
    osFeature?: string;
    /** Set required OS version for the target image instead of the value from the base image. */
    osVersion?: string;
    /** Private, path of PID namespace to join, or 'host'. */
    pid?: string;
    /** Set the OS/ARCH[/VARIANT] of the image to the provided value instead of the current OS/ARCH. */
    platform?: string;
    /** Pull image policy ("always"|"missing"|"never"|"newer"). */
    pull?: string;
    /** Refrain from announcing build instructions and image read/write progress. */
    quiet?: boolean;
    /** Number of times to retry in case of failure when performing push/pull. */
    retry?: number;
    /** Delay between retries in case of push/pull failures. */
    retryDelay?: string;
    /** Set timestamps in layers to no later than the value for --source-date-epoch. */
    rewriteTimestamp?: boolean;
    /** Remove intermediate containers after a successful build. */
    rm?: boolean;
    /** Add global flags for the container runtime. */
    runtimeFlag?: string | string[];
    /** Scan working container using preset configuration. */
    sbom?: string;
    /** Add scan results to image as path. */
    sbomImageOutput?: string;
    /** Add scan results to image as path. */
    sbomImagePurlOutput?: string;
    /** Merge scan results using strategy. */
    sbomMergeStrategy?: string;
    /** Save scan results to file. */
    sbomOutput?: string;
    /** Save scan results to file. */
    sbomPurlOutput?: string;
    /** Scan working container using command in scanner image. */
    sbomScannerCommand?: string;
    /** Scan working container using scanner command from image. */
    sbomScannerImage?: string;
    /** Secret file to expose to the build. */
    secret?: string | string[];
    /** Security options. */
    securityOpt?: string | string[];
    /** Size of '/dev/shm'. The format is <number><unit>. */
    shmSize?: string;
    /** Skips stages in multi-stage builds which do not affect the final target. */
    skipUnusedStages?: boolean;
    /** Set new timestamps in image info to seconds after the epoch. */
    sourceDateEpoch?: number;
    /** Squash all image layers into a single layer. */
    squash?: boolean;
    /** Squash all layers into a single layer. */
    squashAll?: boolean;
    /** SSH agent socket or keys to expose to the build. */
    ssh?: string | string[];
    /** Pass stdin into containers. */
    stdin?: boolean;
    /** Tagged name to apply to the built image. */
    tag?: string | string[];
    /** Set the target build stage to build. */
    target?: string;
    /** Set new timestamps in image info and layer to seconds after the epoch. */
    timestamp?: number;
    /** Ulimit options. */
    ulimit?: string | string[];
    /** Unset annotation when inheriting annotations from base image. */
    unsetannotation?: string | string[];
    /** Unset environment variable from final image. */
    unsetenv?: string | string[];
    /** Unset label when inheriting labels from base image. */
    unsetlabel?: string | string[];
    /** 'container', path of user namespace to join, or 'host'. */
    userns?: string;
    /** ContainerGID:hostGID:length GID mapping to use in user namespace. */
    usernsGidMap?: string;
    /** Name of entries from /etc/subgid to use to set user namespace GID mapping. */
    usernsGidMapGroup?: string;
    /** ContainerUID:hostUID:length UID mapping to use in user namespace. */
    usernsUidMap?: string;
    /** Name of entries from /etc/subuid to use to set user namespace UID mapping. */
    usernsUidMapUser?: string;
    /** Private, :path of UTS namespace to join, or 'host'. */
    uts?: string;
    /** Override the variant of the specified image. */
    variant?: string;
    /** Bind mount a volume into the container. */
    volume?: string | string[];
};
/**
 * Builds a container image using podman build.
 *
 * Use [`forceStartMachine`]{@link forceStartMachine} (or [`isMachineRunning`]{@link isMachineRunning} + [`startMachine`]{@link startMachine})
 * first when running against a Podman VM.
 *
 * @param options Build options for podman build.
 * @returns Resolves with the built image ID (sha256 hash).
 *
 * @example
 * ```ts
 * import {build} from 'podman'
 *
 * const imageId = await build({context: '.', tag: 'my-app:latest'})
 * console.log(imageId)
 * ```
 *
 * @example
 * ```ts
 * import {forceStartMachine, build} from 'podman'
 *
 * await forceStartMachine()
 * const imageId = await build({file: './Containerfile', tag: 'my-app:dev'})
 * console.log(imageId)
 * ```
 */
export declare function build(options?: PodmanBuildOptions): Promise<string>;
export {};
