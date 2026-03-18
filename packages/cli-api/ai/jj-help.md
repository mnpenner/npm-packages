```sh
Mark@DESKTOP-NN7TD9I ~
$ jj --help
Jujutsu (An experimental VCS)

To get started, see the tutorial [`jj help -k tutorial`].

[`jj help -k tutorial`]: https://jj-vcs.github.io/jj/latest/tutorial/

Usage: jj.exe [OPTIONS] <COMMAND>

Commands:
  abandon           Abandon a revision
  absorb            Move changes from a revision into the stack of mutable revisions
  bisect            Find a bad revision by bisection
  bookmark          Manage bookmarks [default alias: b]
  commit            Update the description and create a new change on top [default alias: ci]
  config            Manage config options
  describe          Update the change description or other metadata [default alias: desc]
  diff              Compare file contents between two revisions
  diffedit          Touch up the content changes in a revision with a diff editor
  duplicate         Create new changes with the same content as existing ones
  edit              Sets the specified revision as the working-copy revision
  evolog            Show how a change has evolved over time [aliases: evolution-log]
  file              File operations
  fix               Update files with formatting fixes or other changes
  gerrit            Interact with Gerrit Code Review
  git               Commands for working with Git remotes and the underlying Git repo
  help              Print this message or the help of the given subcommand(s)
  interdiff         Compare the changes of two commits
  log               Show revision history
  metaedit          Modify the metadata of a revision without changing its content
  new               Create a new, empty change and (by default) edit it in the working copy
  next              Move the working-copy commit to the child revision
  operation         Commands for working with the operation log [aliases: op]
  parallelize       Parallelize revisions by making them siblings
  prev              Change the working copy revision relative to the parent revision
  rebase            Move revisions to different parent(s)
  redo              Redo the most recently undone operation
  resolve           Resolve conflicted files with an external merge tool
  restore           Restore paths from another revision
  revert            Apply the reverse of the given revision(s)
  root              Show the current workspace root directory (shortcut for `jj workspace root`)
  show              Show commit description and changes in a revision
  sign              Cryptographically sign a revision
  simplify-parents  Simplify parent edges for the specified revision(s)
  sparse            Manage which paths from the working-copy commit are present in the working copy
  split             Split a revision in two
  squash            Move changes from a revision into another revision
  status            Show high-level repo status [default alias: st]
  tag               Manage tags
  undo              Undo the last operation
  unsign            Drop a cryptographic signature
  util              Infrequently used commands such as for generating shell completions
  version           Display version information
  workspace         Commands for working with workspaces

Options:
  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version

Global Options:
  -R, --repository <REPOSITORY>
          Path to repository to operate on

          By default, Jujutsu searches for the closest .jj/ directory in an ancestor of the current working directory.

      --ignore-working-copy
          Don't snapshot the working copy, and don't update it

          By default, Jujutsu snapshots the working copy at the beginning of every command. The working copy is also updated at the end of the command, if the command modified the
          working-copy commit (`@`). If you want to avoid snapshotting the working copy and instead see a possibly stale working-copy commit, you can use `--ignore-working-copy`. This may
          be useful e.g. in a command prompt, especially if you have another process that commits the working copy.

          Loading the repository at a specific operation with `--at-operation` implies `--ignore-working-copy`.

      --ignore-immutable
          Allow rewriting immutable commits

          By default, Jujutsu prevents rewriting commits in the configured set of immutable commits. This option disables that check and lets you rewrite any commit but the root commit.

          This option only affects the check. It does not affect the `immutable_heads()` revset or the `immutable` template keyword.

      --at-operation <AT_OPERATION>
          Operation to load the repo at

          Operation to load the repo at. By default, Jujutsu loads the repo at the most recent operation, or at the merge of the divergent operations if any.

          You can use `--at-op=<operation ID>` to see what the repo looked like at an earlier operation. For example `jj --at-op=<operation ID> st` will show you what `jj st` would have
          shown you when the given operation had just finished. `--at-op=@` is pretty much the same as the default except that divergent operations will never be merged.

          Use `jj op log` to find the operation ID you want. Any unambiguous prefix of the operation ID is enough.

          When loading the repo at an earlier operation, the working copy will be ignored, as if `--ignore-working-copy` had been specified.

          It is possible to run mutating commands when loading the repo at an earlier operation. Doing that is equivalent to having run concurrent commands starting at the earlier
          operation. There's rarely a reason to do that, but it is possible.

          [aliases: --at-op]

      --debug
          Enable debug logging

      --color <WHEN>
          When to colorize output

          [possible values: always, never, debug, auto]

      --quiet
          Silence non-primary command output

          For example, `jj file list` will still list files, but it won't tell you if the working copy was snapshotted or if descendants were rebased.

          Warnings and errors will still be printed.

      --no-pager
          Disable the pager

      --config <NAME=VALUE>
          Additional configuration options (can be repeated)

          The name should be specified as TOML dotted keys. The value should be specified as a TOML expression. If string value isn't enclosed by any TOML constructs (such as array
          notation), quotes can be omitted.

      --config-file <PATH>
          Additional configuration files (can be repeated)

'jj help --help' lists available keywords. Use 'jj help -k' to show help for one of these keywords.

Mark@DESKTOP-NN7TD9I ~
$ jj file --help
File operations

Usage: jj.exe file [OPTIONS] <COMMAND>

Commands:
  annotate  Show the source change for each line of the target file
  chmod     Sets or removes the executable bit for paths in the repo
  list      List files in a revision
  show      Print contents of files in a revision
  track     Start tracking specified paths in the working copy
  untrack   Stop tracking specified paths in the working copy

Options:
  -h, --help
          Print help (see a summary with '-h')

Global Options:
  -R, --repository <REPOSITORY>
          Path to repository to operate on

          By default, Jujutsu searches for the closest .jj/ directory in an ancestor of the current working directory.

      --ignore-working-copy
          Don't snapshot the working copy, and don't update it

          By default, Jujutsu snapshots the working copy at the beginning of every command. The working copy is also updated at the end of the command, if the command modified the
          working-copy commit (`@`). If you want to avoid snapshotting the working copy and instead see a possibly stale working-copy commit, you can use `--ignore-working-copy`. This may
          be useful e.g. in a command prompt, especially if you have another process that commits the working copy.

          Loading the repository at a specific operation with `--at-operation` implies `--ignore-working-copy`.

      --ignore-immutable
          Allow rewriting immutable commits

          By default, Jujutsu prevents rewriting commits in the configured set of immutable commits. This option disables that check and lets you rewrite any commit but the root commit.

          This option only affects the check. It does not affect the `immutable_heads()` revset or the `immutable` template keyword.

      --at-operation <AT_OPERATION>
          Operation to load the repo at

          Operation to load the repo at. By default, Jujutsu loads the repo at the most recent operation, or at the merge of the divergent operations if any.

          You can use `--at-op=<operation ID>` to see what the repo looked like at an earlier operation. For example `jj --at-op=<operation ID> st` will show you what `jj st` would have
          shown you when the given operation had just finished. `--at-op=@` is pretty much the same as the default except that divergent operations will never be merged.

          Use `jj op log` to find the operation ID you want. Any unambiguous prefix of the operation ID is enough.

          When loading the repo at an earlier operation, the working copy will be ignored, as if `--ignore-working-copy` had been specified.

          It is possible to run mutating commands when loading the repo at an earlier operation. Doing that is equivalent to having run concurrent commands starting at the earlier
          operation. There's rarely a reason to do that, but it is possible.

          [aliases: --at-op]

      --debug
          Enable debug logging

      --color <WHEN>
          When to colorize output

          [possible values: always, never, debug, auto]

      --quiet
          Silence non-primary command output

          For example, `jj file list` will still list files, but it won't tell you if the working copy was snapshotted or if descendants were rebased.

          Warnings and errors will still be printed.

      --no-pager
          Disable the pager

      --config <NAME=VALUE>
          Additional configuration options (can be repeated)

          The name should be specified as TOML dotted keys. The value should be specified as a TOML expression. If string value isn't enclosed by any TOML constructs (such as array
          notation), quotes can be omitted.

      --config-file <PATH>
          Additional configuration files (can be repeated)
          
          
Mark@DESKTOP-NN7TD9I ~
$ jj file show --help
Print contents of files in a revision

If the given path is a directory, files in the directory will be visited recursively.

Usage: jj.exe file show [OPTIONS] <FILESETS>...

Arguments:
  <FILESETS>...
          Paths to print

Options:
  -r, --revision <REVSET>
          The revision to get the file contents from

          [default: @]

  -T, --template <TEMPLATE>
          Render each file metadata using the given template

          All 0-argument methods of the [`TreeEntry` type] are available as keywords in the template expression. See [`jj help -k templates`] for more information.

          If not specified, this defaults to the `templates.file_show` setting.

          [`TreeEntry` type]: https://jj-vcs.github.io/jj/latest/templates/#treeentry-type

          [`jj help -k templates`]: https://jj-vcs.github.io/jj/latest/templates/

  -h, --help
          Print help (see a summary with '-h')

Global Options:
  -R, --repository <REPOSITORY>
          Path to repository to operate on

          By default, Jujutsu searches for the closest .jj/ directory in an ancestor of the current working directory.

      --ignore-working-copy
          Don't snapshot the working copy, and don't update it

          By default, Jujutsu snapshots the working copy at the beginning of every command. The working copy is also updated at the end of the command, if the command modified the
          working-copy commit (`@`). If you want to avoid snapshotting the working copy and instead see a possibly stale working-copy commit, you can use `--ignore-working-copy`. This may
          be useful e.g. in a command prompt, especially if you have another process that commits the working copy.

          Loading the repository at a specific operation with `--at-operation` implies `--ignore-working-copy`.

      --ignore-immutable
          Allow rewriting immutable commits

          By default, Jujutsu prevents rewriting commits in the configured set of immutable commits. This option disables that check and lets you rewrite any commit but the root commit.

          This option only affects the check. It does not affect the `immutable_heads()` revset or the `immutable` template keyword.

      --at-operation <AT_OPERATION>
          Operation to load the repo at

          Operation to load the repo at. By default, Jujutsu loads the repo at the most recent operation, or at the merge of the divergent operations if any.

          You can use `--at-op=<operation ID>` to see what the repo looked like at an earlier operation. For example `jj --at-op=<operation ID> st` will show you what `jj st` would have
          shown you when the given operation had just finished. `--at-op=@` is pretty much the same as the default except that divergent operations will never be merged.

          Use `jj op log` to find the operation ID you want. Any unambiguous prefix of the operation ID is enough.

          When loading the repo at an earlier operation, the working copy will be ignored, as if `--ignore-working-copy` had been specified.

          It is possible to run mutating commands when loading the repo at an earlier operation. Doing that is equivalent to having run concurrent commands starting at the earlier
          operation. There's rarely a reason to do that, but it is possible.

          [aliases: --at-op]

      --debug
          Enable debug logging

      --color <WHEN>
          When to colorize output

          [possible values: always, never, debug, auto]

      --quiet
          Silence non-primary command output

          For example, `jj file list` will still list files, but it won't tell you if the working copy was snapshotted or if descendants were rebased.

          Warnings and errors will still be printed.

      --no-pager
          Disable the pager

      --config <NAME=VALUE>
          Additional configuration options (can be repeated)

          The name should be specified as TOML dotted keys. The value should be specified as a TOML expression. If string value isn't enclosed by any TOML constructs (such as array
          notation), quotes can be omitted.

      --config-file <PATH>
          Additional configuration files (can be repeated)          
          
          
$ jj new --help
Create a new, empty change and (by default) edit it in the working copy

By default, `jj` will edit the new change, making the [working copy] represent the new commit. This can be avoided with `--no-edit`.

Note that you can create a merge commit by specifying multiple revisions as argument. For example, `jj new @ main` will create a new commit with the working copy and the `main` bookmark
as parents.

[working copy]: https://jj-vcs.github.io/jj/latest/working-copy/

Usage: jj.exe new [OPTIONS] [REVSETS]...

Arguments:
  [REVSETS]...
          Parent(s) of the new change

          [default: @]

Options:
  -m, --message <MESSAGE>
          The change description to use

      --no-edit
          Do not edit the newly created change

  -A, --insert-after <REVSETS>
          Insert the new change after the given commit(s)

          Example: `jj new --after A` creates a new change between `A` and its
          children:

          ```text
                          B   C
                           \ /
              B   C   =>    @
               \ /          |
                A           A
          ```

          Specifying `--after` multiple times will relocate all children of the
          given commits.

          Example: `jj new --after A --after X` creates a change with `A` and `X`
          as parents, and rebases all children on top of the new change:

          ```text
                          B   Y
                           \ /
              B  Y    =>    @
              |  |         / \
              A  X        A   X
          ```

          [aliases: --after]

  -B, --insert-before <REVSETS>
          Insert the new change before the given commit(s)

          Example: `jj new --before C` creates a new change between `C` and its
          parents:

          ```text
                             C
                             |
                C     =>     @
               / \          / \
              A   B        A   B
          ```

          `--after` and `--before` can be combined.

          Example: `jj new --after A --before D`:

          ```text

              D            D
              |           / \
              C          |   C
              |    =>    @   |
              B          |   B
              |           \ /
              A            A
          ```

          Similar to `--after`, you can specify `--before` multiple times.

          [aliases: --before]

  -h, --help
          Print help (see a summary with '-h')

Global Options:
  -R, --repository <REPOSITORY>
          Path to repository to operate on

          By default, Jujutsu searches for the closest .jj/ directory in an ancestor of the current working directory.

      --ignore-working-copy
          Don't snapshot the working copy, and don't update it

          By default, Jujutsu snapshots the working copy at the beginning of every command. The working copy is also updated at the end of the command, if the command modified the
          working-copy commit (`@`). If you want to avoid snapshotting the working copy and instead see a possibly stale working-copy commit, you can use `--ignore-working-copy`. This may
          be useful e.g. in a command prompt, especially if you have another process that commits the working copy.

          Loading the repository at a specific operation with `--at-operation` implies `--ignore-working-copy`.

      --ignore-immutable
          Allow rewriting immutable commits

          By default, Jujutsu prevents rewriting commits in the configured set of immutable commits. This option disables that check and lets you rewrite any commit but the root commit.

          This option only affects the check. It does not affect the `immutable_heads()` revset or the `immutable` template keyword.

      --at-operation <AT_OPERATION>
          Operation to load the repo at

          Operation to load the repo at. By default, Jujutsu loads the repo at the most recent operation, or at the merge of the divergent operations if any.

          You can use `--at-op=<operation ID>` to see what the repo looked like at an earlier operation. For example `jj --at-op=<operation ID> st` will show you what `jj st` would have
          shown you when the given operation had just finished. `--at-op=@` is pretty much the same as the default except that divergent operations will never be merged.

          Use `jj op log` to find the operation ID you want. Any unambiguous prefix of the operation ID is enough.

          When loading the repo at an earlier operation, the working copy will be ignored, as if `--ignore-working-copy` had been specified.

          It is possible to run mutating commands when loading the repo at an earlier operation. Doing that is equivalent to having run concurrent commands starting at the earlier
          operation. There's rarely a reason to do that, but it is possible.

          [aliases: --at-op]

      --debug
          Enable debug logging

      --color <WHEN>
          When to colorize output

          [possible values: always, never, debug, auto]

      --quiet
          Silence non-primary command output

          For example, `jj file list` will still list files, but it won't tell you if the working copy was snapshotted or if descendants were rebased.

          Warnings and errors will still be printed.

      --no-pager
          Disable the pager

      --config <NAME=VALUE>
          Additional configuration options (can be repeated)

          The name should be specified as TOML dotted keys. The value should be specified as a TOML expression. If string value isn't enclosed by any TOML constructs (such as array
          notation), quotes can be omitted.

      --config-file <PATH>
          Additional configuration files (can be repeated)
          
```
