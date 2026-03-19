```
Mark@DESKTOP-NN7TD9I ~/PhpstormProjects/clap
$ examples/root-command.ts -name=foo bar -v
Preparing greeting...
bar foo
```

This shouldn't have worked. It should have been interpreted as `-n -a -m -e foo bar -v`
