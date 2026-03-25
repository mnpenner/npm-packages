```
Mark@DESKTOP-NN7TD9I ~/PhpstormProjects/clap
$ examples/kubectl.ts --kubeconfig=foo

  File C:\Users\Mark\PhpstormProjects\clap\foo does not exist


Mark@DESKTOP-NN7TD9I ~/PhpstormProjects/clap
$ examples/kubectl.ts --kubeconfig=foo --no-color

  File C:\Users\Mark\PhpstormProjects\clap\foo does not exist


Mark@DESKTOP-NN7TD9I ~/PhpstormProjects/clap
$ examples/jj.ts -R foo

  ENOENT: no such file or directory, access 'foo'
```

When color is disabled, make it so blockError() doesn't print as a block, it should just print the error message.

Also blockError should write to stderr (always; color or not).

Also adjust the `INPUT_DIRECTORY` error message, it shouldn't say "ENOENT", it should give a nice friendly error message like the File error message above.

Also check the other OptType error messages, they should all have nice messages.

Also for all of them, specify which option triggered the error.
