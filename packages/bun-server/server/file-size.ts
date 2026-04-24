const SIZE_UNITS = [['B', 0], ['KiB', 1], ['MiB', 2], ['GiB', 2], ['TiB', 3], ['PiB', 3], ['EiB', 4], ['ZiB', 4], ['YiB', 5]] as const
const SIZE_UNITS_END = SIZE_UNITS.length - 1
const BYTES_PER_KB = 1024

export function humanFileSize(bytes: number): string {
    let u, rounded

    for(u = 0; ; ++u) {
        rounded = bytes.toFixed(SIZE_UNITS[u]![1])
        if(u === SIZE_UNITS_END || +rounded < BYTES_PER_KB) {
            break
        }
        bytes /= BYTES_PER_KB
    }

    return `${rounded} ${SIZE_UNITS[u]![0]}`
}
