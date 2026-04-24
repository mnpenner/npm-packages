# @mpen/classcat

Conditionally concatenate class names.

## Benchmark

- clk: ~2.88 GHz
- cpu: 11th Gen Intel(R) Core(TM) i9-11900K @ 3.50GHz
- runtime: bun 1.3.13 (x64-win32)

| cc              | avg              | min         | p75         | p99         | max         |
|-----------------|------------------|-------------|-------------|-------------|-------------|
| strings         | ` 37.39 ns/iter` | ` 31.57 ns` | ` 34.16 ns` | `188.72 ns` | `270.31 ns` |
| array           | `103.82 ns/iter` | ` 89.89 ns` | `105.76 ns` | `261.72 ns` | `319.73 ns` |
| object          | ` 45.82 ns/iter` | ` 38.40 ns` | ` 42.65 ns` | `198.88 ns` | `249.12 ns` |
| nested          | `125.23 ns/iter` | `115.21 ns` | `121.19 ns` | `281.37 ns` | `305.47 ns` |
| mixed arguments | `151.46 ns/iter` | `135.45 ns` | `143.31 ns` | `311.69 ns` | `439.60 ns` |

## Similar Projects

- [classcat](https://npmx.dev/package/classcat)
- [classnames](https://npmx.dev/package/classnames)
- [clsx](https://npmx.dev/package/clsx)

