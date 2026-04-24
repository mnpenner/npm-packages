# podman

Minimal helper to start a Podman machine from Bun or Node.

## Install

```sh
bun add podman
npm i podman
```

## Usage

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
