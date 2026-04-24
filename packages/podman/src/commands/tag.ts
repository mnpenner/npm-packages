import {ArgBuilder} from '../lib/arg-builder.ts'
import {execPodmanStreaming} from '../lib/podman-spawn.ts'

/**
 * Adds one or more additional names to a local image.
 *
 * @param image Image ID or name to tag.
 * @param targetNames One or more target names (including optional registry/namespace).
 * @returns Resolves when the tag operation succeeds.
 *
 * @example
 * ```ts
 * import {tag} from 'podman'
 *
 * await tag('0e3bbc2', 'fedora:latest')
 * ```
 *
 * @example
 * ```ts
 * import {tag} from 'podman'
 *
 * await tag('imageID:latest', 'myNewImage:newTag')
 * ```
 *
 * @example
 * ```ts
 * import {tag} from 'podman'
 *
 * await tag('httpd', 'myregistryhost:5000/fedora/httpd:v2')
 * ```
 */
export async function tag(image: string, targetNames: string | string[]): Promise<void> {
    const args = new ArgBuilder('tag')
    const targets = Array.isArray(targetNames) ? targetNames : [targetNames]

    if(targets.length === 0) {
        throw new Error('podman tag requires at least one target name.')
    }

    args.add(image)
    for(const target of targets) {
        args.add(target)
    }

    return execPodmanStreaming(args.toArgs())
}
