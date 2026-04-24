# podman

Minimal helper to start a Podman machine from Bun or Node.

## Install

```sh
bun add podman
npm i podman
```

## Quick Start

```ts
import * as podman from 'podman'

await podman.forceStartMachine()  // podman-machine-default
await podman.forceStartMachine('your-machine-name')

const machines = await podman.listMachines()
console.log(machines.map((machine) => machine.Name))

const imageId = await podman.build({
  context: '.',
  file: 'Containerfile',
  tag: 'example:latest',
})

await podman.push({
  image: 'example:latest',
  destination: 'docker://registry.example.com/repository:tag',
  creds: 'username:password',
})
```

## API

### `run(options, processOptions?)`
Runs a command in a new container. Returns a `Process` instance.
- `options`: Options matching `podman run` flags (e.g., `image`, `command`, `env`, `volume`, etc.).
- `processOptions`: Configuration for stdio, environment, and identity.

### `build(options?)`
Builds a container image. Returns the built image ID (sha256 hash).
- `options`: Options matching `podman build` flags (e.g., `context`, `file`, `tag`, `buildArg`, etc.).

### `push(options)`
Pushes an image to a registry.
- `options`: Options matching `podman push` flags (e.g., `image`, `destination`, `creds`, `tlsVerify`, etc.).

### `tag(image, targetNames)`
Adds one or more names to a local image.
- `image`: Image ID or name.
- `targetNames`: Single string or array of strings.

### `listMachines()`
Returns a list of Podman machines.

### `isMachineRunning(machineName?)`
Checks if a machine is running. Defaults to `podman-machine-default`.

### `startMachine(machineName?)`
Starts a Podman machine.

### `forceStartMachine(machineName?)`
Starts a machine if it isn't already running. Returns `true` if it was started, `false` if it was already running.

### `Process`
Class for controlling spawned processes.
- `wait(timeoutMs?)`: Wait for exit. Returns exit code.
- `waitOrThrow(timeoutMs?)`: Wait for exit, throws if code is non-zero.
- `kill()`: Sends `SIGKILL`.
- `term()`: Sends `SIGTERM`.
- `on('data', (chunk, fd) => ...)`: Listen for output. `fd` is 1 for stdout, 2 for stderr.

### `StreamIn` / `StreamOut`
Enums for stdio configuration:
- `StreamIn`: `EMPTY`, `INHERIT`, `PIPE`
- `StreamOut`: `DISCARD`, `CLOSE`, `INHERIT`, `PIPE`, `TEE`

