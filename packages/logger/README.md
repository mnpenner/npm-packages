# @mpen/logger

Lightweight logging utilities for structured JSON logs, styled browser console output, and Bun terminal output.

## Installation

```sh
bun add @mpen/logger
```

## Shared Types

```ts
import { LogLevel, type Logger } from '@mpen/logger'
```

## JSON Logger

```ts
import { JsonLogger } from '@mpen/logger/json'
import { LogLevel } from '@mpen/logger'

const logger = new JsonLogger({ minLogLevel: LogLevel.INFO })

logger.info('server started')
logger.warn('retrying request', { attempt: 2 })
```

`JsonLogger` writes newline-delimited JSON records with ISO timestamps. It converts common non-JSON values such as errors, symbols, bigint values, maps, sets, and circular references into serializable values.

## Browser Logger

```ts
import { BrowserLogger } from '@mpen/logger/browser'

const logger = new BrowserLogger()

logger.info('Loaded user', { id: 1, name: 'Ada' })
logger.table([{ id: 1, status: 'active' }])
```

`BrowserLogger` writes to the browser DevTools console and formats structured values with CSS styles.

## Terminal Logger

```ts
import { TerminalLogger } from '@mpen/logger/terminal'

const logger = new TerminalLogger()

logger.info('build started')
logger.table([
    { name: 'api', status: 'ok', ms: 42 },
    { name: 'worker', status: 'slow', ms: 180 },
])
```

`TerminalLogger` is intended for Bun runtimes. It uses Bun's string width support to render wrapped terminal logs and tables.
