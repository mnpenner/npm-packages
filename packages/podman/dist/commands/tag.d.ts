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
export declare function tag(image: string, targetNames: string | string[]): Promise<void>;
