# @mpen/logger

Lightweight logging utilities for structured JSON logs, styled browser console output, and terminal output.

## Installation

```sh
npm install @mpen/logger
```

## Usage

```ts
import { BrowserLogger, JsonLogger, LogLevel, TerminalLogger, type Logger } from '@mpen/logger'
```

## JSON Logger

```ts
import { JsonLogger, LogLevel } from '@mpen/logger'

const logger = new JsonLogger({ minLogLevel: LogLevel.INFO })

logger.info('server started')
logger.warn('retrying request', { attempt: 2 })
```

`JsonLogger` writes newline-delimited JSON records with ISO timestamps. It converts common non-JSON values such as errors, symbols, bigint values, maps, sets, and circular references into serializable values.

## Browser Logger

```ts
import { BrowserLogger } from '@mpen/logger'

const logger = new BrowserLogger()

logger.info('Loaded user', { id: 1, name: 'Ada' })
logger.table([{ id: 1, status: 'active' }])
```

`BrowserLogger` writes to the browser DevTools console and formats structured values with CSS styles.

## Terminal Logger

```ts
import { TerminalLogger } from '@mpen/logger'

const logger = new TerminalLogger()

logger.info('build started')
logger.table([
    { name: 'api', status: 'ok', ms: 42 },
    { name: 'worker', status: 'slow', ms: 180 },
])
```

`TerminalLogger` uses Unicode-aware string width measurement to render wrapped terminal logs and tables.
