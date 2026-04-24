
I have a *_provide_* and I want to pass it to a command that is expecting an *_expect_*...

| provide╲expect | string                                        | command                              | file                                                                      | stdin                    |
|----------------|-----------------------------------------------|--------------------------------------|---------------------------------------------------------------------------|--------------------------|
| string         | `printf '%q ' 'foo bar'`                      | `eval 'echo foo'`                    | `realpath =(<<<'foo')`                                                    | `sponge <<<'foo'`        | 
| command        | `printf '%q ' "$(echo foo bar)"`              | `sh -c 'echo foo'`                   | `realpath =(echo foo)` (tmp file)<br/>`realpath <(echo foo)` (named pipe) | `echo foo &#124; sponge` |
| file           | `printf '%q ' "$(<foo.txt)"`                  | `xargs -a foo.txt -- printf '%q '`   | `realpath foo.txt`                                                        | `sponge <foo.txt`        | 
| stdout         | `echo foo &#124; xargs -I_ -- printf '%q ' _` | `echo -n 'echo foo' &#124; "$SHELL"` | `echo foo &#124; cat /dev/stdin`                                          | `echo foo &#124; sponge` | 
- https://zsh.sourceforge.io/Doc/Release/Redirection.html
- https://linux.die.net/man/1/zshexpn "Process Substitution"
