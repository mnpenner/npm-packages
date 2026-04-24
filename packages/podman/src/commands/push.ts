import {ArgBuilder} from '../lib/arg-builder.ts'
import {execPodmanStreaming} from '../lib/podman-spawn.ts'

type PodmanPushOptions = {
    /** Source image to push. */
    image: string
    /** Destination to push the image to. */
    destination?: string
    /** Path of the authentication file. */
    authfile?: string
    /** Compression format to use. */
    compressionFormat?: string
    /** Compression level to use. */
    compressionLevel?: number
    /** Credentials (USERNAME:PASSWORD) to use for authenticating to a registry. */
    creds?: string
    /** Write the digest of the pushed image to the specified file. */
    digestfile?: string
    /** This is a Docker specific option and is a NOOP. */
    disableContentTrust?: boolean
    /** Use the specified compression algorithm even if the destination contains a differently-compressed variant already. */
    forceCompression?: boolean
    /** Manifest type (oci, v2s2, or v2s1) to use in the destination. */
    format?: string
    /** Discard any pre-existing signatures in the image. */
    removeSignatures?: boolean
    /** Number of times to retry in case of failure when performing push. */
    retry?: number
    /** Delay between retries in case of push failures. */
    retryDelay?: string
    /** Require HTTPS and verify certificates when contacting registries. */
    tlsVerify?: boolean
}

/**
 * Pushes a container image to a specified destination.
 *
 * @param options Push options for podman push.
 * @returns Resolves when the push succeeds.
 *
 * @example
 * ```ts
 * import {push} from 'podman'
 *
 * await push({image: 'my-app:latest', destination: 'docker://registry.example.com/my-app:latest'})
 * ```
 */
export async function push(options: PodmanPushOptions): Promise<void> {
    const args = new ArgBuilder('push')

    args.addValue('--authfile', options.authfile)
    args.addValue('--compression-format', options.compressionFormat)
    args.addValue('--compression-level', options.compressionLevel)
    args.addValue('--creds', options.creds)
    args.addValue('--digestfile', options.digestfile)
    args.addBool('--disable-content-trust', options.disableContentTrust)
    args.addBool('--force-compression', options.forceCompression)
    args.addValue('--format', options.format)
    args.addBool('--remove-signatures', options.removeSignatures)
    args.addValue('--retry', options.retry)
    args.addValue('--retry-delay', options.retryDelay)
    args.addBool('--tls-verify', options.tlsVerify)

    args.add(options.image)
    if(options.destination) {
        args.add(options.destination)
    }

    return execPodmanStreaming(args.toArgs())
}
