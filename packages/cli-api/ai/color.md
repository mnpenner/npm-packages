Add `--color=<WHEN>` as a global option with options always,never,auto. "auto" should infer whether or not to enable color based on the user's environment using whatever heuristics are typical of CLI apps.

We can probably implement this by attaching a _chalk instance to App and setting `level` appropriately based on `supportsColor` when --color=auto, or set level to 0 when --color=never.

```ts
import {Chalk, supportsColor} from 'chalk';

const customChalk = new Chalk({level: 0});
```


Also support `--no-color` as an alias for `--color=never`.

`--color` should be interpreted as --color=always. The value should be optional (valueNotRequired). Make sure this shows correctly in the help text, like `--color[=WHEN]`. Specifically, use `--opt[=PLACEHOLDER]` style when the value is optional, and `--opt=PLACEHOLDER` style when the value is required.
