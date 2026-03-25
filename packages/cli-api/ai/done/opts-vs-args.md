```
Mark@DESKTOP-NN7TD9I ~/PhpstormProjects/clap
$ examples/root-command.ts -nfoo g x
{
  args: [ "g", "x" ],
  opts: [Object: null prototype] {
    disclaimer: [ "x" ],
    name: "foo",
    greet: "g",
    color: "auto",
  },
}
```

Positional arguments are in both args and opts. They shouldn't be in both. Should we swap the order of the 2 args? Should we drop `args` and just keep opts?
