#!/usr/bin/env bun
import {App, Command, OptType, type AnyOptType, type Option, ExecutionContext} from '../src'

type CommandSpec = {
    name: string
    description: string
    aliases?: string[]
    longDescription?: string
    options?: Option[]
    arguments?: Array<{
        name: string
        description?: string
        required?: boolean | number
        repeatable?: boolean | number
        defaultValue?: unknown
        defaultValueText?: string
        valuePlaceholder?: string
        type?: AnyOptType
    }>
}

function lines(...parts: string[]): string {
    return parts.join('\n')
}

function logRun(commandName: string) {
    return (args: unknown[], opts: Record<string, unknown>, ctx: ExecutionContext) => {
        console.log({ args, opts,
            commandPath: ctx.commandPath,
            colorLevel: ctx.colorLevel,
        })
    }
}

function applySpec(command: Command, spec: CommandSpec): Command {
    if(spec.aliases?.length) {
        command.aliases(...spec.aliases)
    }
    command.describe(spec.description, spec.longDescription)

    for(const option of spec.options ?? []) {
        if(option.type === OptType.BOOL) {
            command.flag(option.name, option)
            continue
        }
        command.opt(option.name, option)
    }

    for(const arg of spec.arguments ?? []) {
        command.arg(arg.name, arg)
    }

    return command.run(logRun(spec.name))
}

function leaf(spec: CommandSpec): Command {
    return applySpec(new Command(spec.name), spec)
}

const globalOptions: Option[] = [
    {
        name: 'repository',
        alias: 'R',
        valuePlaceholder: 'REPOSITORY',
        description: lines(
            'Path to repository to operate on',
            '',
            'By default, Jujutsu searches for the closest .jj/ directory in an ancestor of the current working directory.',
        ),
    },
    {
        name: 'ignore-working-copy',
        type: OptType.BOOL,
        valueNotRequired: true,
        description: lines(
            "Don't snapshot the working copy, and don't update it",
            '',
            'By default, Jujutsu snapshots the working copy at the beginning of every command. The working copy is also updated at the end of',
            'the command, if the command modified the working-copy commit (`@`). If you want to avoid snapshotting the working copy and instead',
            'see a possibly stale working-copy commit, you can use `--ignore-working-copy`. This may be useful e.g. in a command prompt,',
            'especially if you have another process that commits the working copy.',
            '',
            'Loading the repository at a specific operation with `--at-operation` implies `--ignore-working-copy`.',
        ),
    },
    {
        name: 'ignore-immutable',
        type: OptType.BOOL,
        valueNotRequired: true,
        description: lines(
            'Allow rewriting immutable commits',
            '',
            'By default, Jujutsu prevents rewriting commits in the configured set of immutable commits. This option disables that check and',
            'lets you rewrite any commit but the root commit.',
            '',
            'This option only affects the check. It does not affect the `immutable_heads()` revset or the `immutable` template keyword.',
        ),
    },
    {
        name: 'at-operation',
        alias: 'at-op',
        valuePlaceholder: 'AT_OPERATION',
        description: lines(
            'Operation to load the repo at',
            '',
            'Operation to load the repo at. By default, Jujutsu loads the repo at the most recent operation, or at the merge of the divergent',
            'operations if any.',
            '',
            'You can use `--at-op=<operation ID>` to see what the repo looked like at an earlier operation. For example `jj --at-op=<operation',
            'ID> st` will show you what `jj st` would have shown you when the given operation had just finished. `--at-op=@` is pretty much the',
            'same as the default except that divergent operations will never be merged.',
            '',
            'Use `jj op log` to find the operation ID you want. Any unambiguous prefix of the operation ID is enough.',
            '',
            'When loading the repo at an earlier operation, the working copy will be ignored, as if `--ignore-working-copy` had been specified.',
            '',
            "It is possible to run mutating commands when loading the repo at an earlier operation. Doing that is equivalent to having run",
            "concurrent commands starting at the earlier operation. There's rarely a reason to do that, but it is possible.",
        ),
    },
    {
        name: 'debug',
        type: OptType.BOOL,
        valueNotRequired: true,
        description: 'Enable debug logging',
    },
    {
        name: 'quiet',
        type: OptType.BOOL,
        valueNotRequired: true,
        description: lines(
            'Silence non-primary command output',
            '',
            "For example, `jj file list` will still list files, but it won't tell you if the working copy was snapshotted or if descendants",
            'were rebased.',
            '',
            'Warnings and errors will still be printed.',
        ),
    },
    {
        name: 'no-pager',
        type: OptType.BOOL,
        valueNotRequired: true,
        description: 'Disable the pager',
    },
    {
        name: 'config',
        repeatable: true,
        valuePlaceholder: 'NAME=VALUE',
        description: lines(
            'Additional configuration options (can be repeated)',
            '',
            'The name should be specified as TOML dotted keys. The value should be specified as a TOML expression. If string value isn\'t',
            'enclosed by any TOML constructs (such as array notation), quotes can be omitted.',
        ),
    },
    {
        name: 'config-file',
        repeatable: true,
        valuePlaceholder: 'PATH',
        description: 'Additional configuration files (can be repeated)',
    },
]

const fileCommand = new Command('file')
    .describe('File operations')
    .command(leaf({
        name: 'annotate',
        description: 'Show the source change for each line of the target file',
    }))
    .command(leaf({
        name: 'chmod',
        description: 'Sets or removes the executable bit for paths in the repo',
    }))
    .command(leaf({
        name: 'list',
        description: 'List files in a revision',
    }))
    .command(leaf({
        name: 'show',
        description: 'Print contents of files in a revision',
        longDescription: lines(
            'If the given path is a directory, files in the directory will be visited recursively.',
        ),
        options: [
            {
                name: 'revision',
                alias: 'r',
                valuePlaceholder: 'REVSET',
                description: 'The revision to get the file contents from',
                defaultValue: '@',
                defaultValueText: '@',
            },
            {
                name: 'template',
                alias: 'T',
                valuePlaceholder: 'TEMPLATE',
                description: 'Render each file metadata using the given template',
            },
        ],
        arguments: [
            {
                name: 'filesets',
                description: 'Paths to print',
                repeatable: true,
                required: true,
            },
        ],
    }))
    .command(leaf({
        name: 'track',
        description: 'Start tracking specified paths in the working copy',
    }))
    .command(leaf({
        name: 'untrack',
        description: 'Stop tracking specified paths in the working copy',
    }))

const rootLeafSpecs: CommandSpec[] = [
    {
        name: 'abandon',
        description: 'Abandon a revision',
        longDescription: lines(
            'Abandon a revision, rebasing descendants onto its parent(s). The behavior is similar to `jj restore --changes-in`; the difference',
            'is that `jj abandon` gives you a new change, while `jj restore` updates the existing change.',
            '',
            'If a working-copy commit gets abandoned, it will be given a new, empty commit. This is true in general; it is not specific to',
            'this command.',
        ),
    },
    {
        name: 'absorb',
        description: 'Move changes from a revision into the stack of mutable revisions',
        longDescription: lines(
            'This command splits changes in the source revision and moves each change to the closest mutable ancestor where the corresponding',
            'lines were modified last. If the destination revision cannot be determined unambiguously, the change will be left in the source',
            'revision.',
            '',
            'The source revision will be abandoned if all changes are absorbed into the destination revisions, and if the source revision has',
            'no description.',
            '',
            'The modification made by `jj absorb` can be reviewed by `jj op show -p`.',
        ),
    },
    {name: 'bisect', description: 'Find a bad revision by bisection'},
    {
        name: 'bookmark',
        description: 'Manage bookmarks',
        aliases: ['b'],
        longDescription: lines(
            'See [`jj help -k bookmarks`] for more information.',
            '',
            '[`jj help -k bookmarks`]: https://jj-vcs.github.io/jj/latest/bookmarks',
        ),
    },
    {
        name: 'commit',
        description: 'Update the description and create a new change on top',
        aliases: ['ci'],
        longDescription: lines(
            'When called without path arguments or `--interactive`, `jj commit` is equivalent to `jj describe` followed by `jj new`.',
            '',
            'Otherwise, this command is very similar to `jj split`. Differences include:',
            '',
            '* `jj commit` is not interactive by default (it selects all changes).',
            '',
            "* `jj commit` doesn't have a `-r` option. It always acts on the working-copy commit (@).",
            '',
            "* `jj split` (without `-d/-A/-B`) will move bookmarks forward from the old change to the child change. `jj commit` doesn't move",
            'bookmarks forward.',
            '',
            '* `jj split` allows you to move the selected changes to a different destination with `-d/-A/-B`.',
        ),
    },
    {
        name: 'config',
        description: 'Manage config options',
        longDescription: lines(
            'Operates on jj configuration, which comes from the config file and environment variables.',
            '',
            'See [`jj help -k config`] to know more about file locations, supported config options, and other details about `jj config`.',
            '',
            '[`jj help -k config`]: https://jj-vcs.github.io/jj/latest/config/',
        ),
    },
    {
        name: 'describe',
        description: 'Update the change description or other metadata',
        aliases: ['desc'],
        longDescription: lines(
            'Starts an editor to let you edit the description of changes. The editor will be $EDITOR, or `nano` if that\'s not defined',
            '(`Notepad` on Windows).',
        ),
    },
    {
        name: 'diff',
        description: 'Compare file contents between two revisions',
        longDescription: lines(
            'With the `-r` option, shows the changes compared to the parent revision. If there are several parent revisions (i.e., the given',
            'revision is a merge), then they will be merged and the changes from the result to the given revision will be shown.',
            '',
            'With the `--from` and/or `--to` options, shows the difference from/to the given revisions. If either is left out, it defaults to',
            'the working-copy commit. For example, `jj diff --from main` shows the changes from "main" (perhaps a bookmark name) to the',
            'working-copy commit.',
            '',
            'If no option is specified, it defaults to `-r @`.',
        ),
    },
    {
        name: 'diffedit',
        description: 'Touch up the content changes in a revision with a diff editor',
        longDescription: lines(
            'With the `-r` option, starts a [diff editor] on the changes in the revision.',
            '',
            'With the `--from` and/or `--to` options, starts a [diff editor] comparing the "from" revision to the "to" revision.',
            '',
            '[diff editor]: https://jj-vcs.github.io/jj/latest/config/#editing-diffs',
            '',
            'Edit the right side of the diff until it looks the way you want. Once you close the editor, the revision specified with `-r` or',
            '`--to` will be updated. Unless `--restore-descendants` is used, descendants will be rebased on top as usual, which may result in',
            'conflicts.',
            '',
            "See `jj restore` if you want to move entire files from one revision to another. For moving changes between revisions, see",
            '`jj squash -i`.',
        ),
    },
    {
        name: 'duplicate',
        description: 'Create new changes with the same content as existing ones',
        longDescription: lines(
            'When none of the `--destination`, `--insert-after`, or `--insert-before` arguments are provided, commits will be duplicated onto',
            'their existing parents or onto other newly duplicated commits.',
            '',
            'When any of the `--destination`, `--insert-after`, or `--insert-before` arguments are provided, the roots of the specified commits',
            'will be duplicated onto the destination indicated by the arguments. Other specified commits will be duplicated onto these newly',
            'duplicated commits. If the `--insert-after` or `--insert-before` arguments are provided, the new children indicated by the',
            'arguments will be rebased onto the heads of the specified commits.',
            '',
            'By default, the duplicated commits retain the descriptions of the originals. This can be customized with the',
            '`templates.duplicate_description` setting.',
        ),
    },
    {
        name: 'edit',
        description: 'Sets the specified revision as the working-copy revision',
        longDescription: lines(
            'Note: it is [generally recommended] to instead use `jj new` and `jj squash`.',
            '',
            '[generally recommended]:',
            'https://jj-vcs.github.io/jj/latest/FAQ#how-do-i-resume-working-on-an-existing-change',
        ),
    },
    {
        name: 'evolog',
        description: 'Show how a change has evolved over time',
        aliases: ['evolution-log'],
        longDescription: lines(
            'Lists the previous commits which a change has pointed to. The current commit of a change evolves when the change is updated,',
            'rebased, etc.',
        ),
    },
    {
        name: 'fix',
        description: 'Update files with formatting fixes or other changes',
        longDescription: lines(
            'The primary use case for this command is to apply the results of automatic',
            'code formatting tools to revisions that may not be properly formatted yet.',
            'It can also be used to modify files with other tools like `sed` or `sort`.',
            '',
            'The changed files in the given revisions will be updated with any fixes',
            'determined by passing their file content through any external tools the user',
            'has configured for those files. Descendants will also be updated by passing',
            'their versions of the same files through the same tools, which will ensure',
            'that the fixes are not lost. This will never result in new conflicts. Files',
            'with existing conflicts will be updated on all sides of the conflict, which',
            'can potentially increase or decrease the number of conflict markers.',
        ),
    },
    {name: 'gerrit', description: 'Interact with Gerrit Code Review'},
    {
        name: 'git',
        description: 'Commands for working with Git remotes and the underlying Git repo',
        longDescription: lines(
            'See this [comparison], including a [table of commands].',
            '',
            '[comparison]: https://jj-vcs.github.io/jj/latest/git-comparison/.',
            '',
            '[table of commands]: https://jj-vcs.github.io/jj/latest/git-command-table',
        ),
    },
    {
        name: 'interdiff',
        description: 'Compare the changes of two commits',
        longDescription: lines(
            "This excludes changes from other commits by temporarily rebasing `--from` onto `--to`'s parents. If you wish to compare the same",
            'change across versions, consider `jj evolog -p` instead.',
        ),
    },
    {
        name: 'log',
        description: 'Show revision history',
        longDescription: lines(
            'Renders a graphical view of the project\'s history, ordered with children before parents. By default, the output only includes',
            'mutable revisions, along with some additional revisions for context. Use `jj log -r ::` to see all revisions. See',
            '[`jj help -k revsets`] for information about the syntax.',
            '',
            '[`jj help -k revsets`]: https://jj-vcs.github.io/jj/latest/revsets/',
            '',
            'Spans of revisions that are not included in the graph per `--revisions` are rendered as a synthetic node labeled',
            '"(elided revisions)".',
            '',
            'The working-copy commit is indicated by a `@` symbol in the graph. [Immutable revisions] have a `◆` symbol. Other commits have a',
            '`○` symbol. All of these symbols can be [customized].',
            '',
            '[Immutable revisions]: https://jj-vcs.github.io/jj/latest/config/#set-of-immutable-commits',
            '',
            '[customized]: https://jj-vcs.github.io/jj/latest/config/#node-style',
        ),
    },
    {name: 'metaedit', description: 'Modify the metadata of a revision without changing its content'},
    {
        name: 'new',
        description: 'Create a new, empty change and (by default) edit it in the working copy',
        longDescription: lines(
            'By default, `jj` will edit the new change, making the [working copy] represent the new commit. This can be avoided with',
            '`--no-edit`.',
            '',
            'Note that you can create a merge commit by specifying multiple revisions as argument. For example, `jj new @ main` will create a',
            'new commit with the working copy and the `main` bookmark as parents.',
            '',
            '[working copy]: https://jj-vcs.github.io/jj/latest/working-copy/',
        ),
        options: [
            {
                name: 'message',
                alias: 'm',
                valuePlaceholder: 'MESSAGE',
                description: 'The change description to use',
            },
            {
                name: 'no-edit',
                type: OptType.BOOL,
                valueNotRequired: true,
                description: 'Do not edit the newly created change',
            },
            {
                name: 'insert-after',
                alias: 'A',
                valuePlaceholder: 'REVSETS',
                repeatable: true,
                description: 'Insert the new change after the given commit(s)',
            },
            {
                name: 'insert-before',
                alias: 'B',
                valuePlaceholder: 'REVSETS',
                repeatable: true,
                description: 'Insert the new change before the given commit(s)',
            },
        ],
        arguments: [
            {
                name: 'revsets',
                description: 'Parent(s) of the new change',
                repeatable: true,
            },
        ],
    },
    {
        name: 'next',
        description: 'Move the working-copy commit to the child revision',
        longDescription: lines(
            'The command creates a new empty working copy revision that is the child of a descendant `offset` revisions ahead of the parent of',
            'the current working copy.',
            '',
            'If `--edit` is passed, the working copy revision is changed to the child of the current working copy revision.',
        ),
    },
    {
        name: 'operation',
        description: 'Commands for working with the operation log',
        aliases: ['op'],
        longDescription: lines(
            'See the [operation log documentation] for more information.',
            '',
            '[operation log documentation]: https://jj-vcs.github.io/jj/latest/operation-log/',
        ),
    },
    {
        name: 'parallelize',
        description: 'Parallelize revisions by making them siblings',
        longDescription: lines(
            'The command effectively says "these revisions are actually independent", meaning that they should no longer be',
            'ancestors/descendants of each other.',
        ),
    },
    {
        name: 'prev',
        description: 'Change the working copy revision relative to the parent revision',
        longDescription: lines(
            'The command creates a new empty working copy revision that is the child of an ancestor `offset` revisions behind the parent of the',
            'current working copy.',
            '',
            'If `--edit` is passed, the working copy revision is changed to the parent of the current working copy revision.',
        ),
    },
    {
        name: 'rebase',
        description: 'Move revisions to different parent(s)',
        longDescription: lines(
            'This command moves revisions to different parent(s) while preserving the changes (diff) in the revisions.',
            '',
            'There are three different ways of specifying which revisions to rebase:',
            '',
            '* `--source/-s` to rebase a revision and its descendants',
            '* `--branch/-b` to rebase a whole branch, relative to the destination',
            '* `--revisions/-r` to rebase the specified revisions without their descendants',
            '',
            'There are three different ways of specifying where the revisions should be rebased to:',
            '',
            '* `--destination/-d` to rebase the revisions onto the specified targets',
            '* `--insert-after/-A` to rebase the revisions onto the specified targets and to rebase the targets\' descendants onto the rebased revisions',
            '* `--insert-before/-B` to rebase the revisions onto the specified targets\' parents and to rebase the targets and their descendants onto the rebased revisions',
        ),
    },
    {
        name: 'redo',
        description: 'Redo the most recently undone operation',
        longDescription: lines(
            'This is the natural counterpart of `jj undo`. Repeated invocations of `jj undo` and `jj redo` act similarly to Undo/Redo commands',
            'in a text editor.',
            '',
            'Use `jj op log` to visualize the log of past operations, including a detailed description of any past undo/redo operations. See',
            'also `jj op restore` to explicitly restore an older operation by its id (available in the operation log).',
        ),
    },
    {
        name: 'resolve',
        description: 'Resolve conflicted files with an external merge tool',
        longDescription: lines(
            'Only conflicts that can be resolved with a 3-way merge are supported. See docs for merge tool configuration instructions.',
            'External merge tools will be invoked for each conflicted file one-by-one until all conflicts are resolved. To stop resolving',
            'conflicts, exit the merge tool without making any changes.',
            '',
            'Note that conflicts can also be resolved without using this command. You may edit the conflict markers in the conflicted file',
            'directly with a text editor.',
        ),
    },
    {
        name: 'restore',
        description: 'Restore paths from another revision',
        longDescription: lines(
            'That means that the paths get the same content in the destination (`--to`) as they had in the source (`--from`). This is typically',
            'used for undoing changes to some paths in the working copy (`jj restore <paths>`).',
            '',
            'If only one of `--from` or `--to` is specified, the other one defaults to the working copy.',
            '',
            'When neither `--from` nor `--to` is specified, the command restores into the working copy from its parent(s). `jj restore`',
            'without arguments is similar to `jj abandon`, except that it leaves an empty revision with its description and other metadata',
            'preserved.',
        ),
    },
    {
        name: 'revert',
        description: 'Apply the reverse of the given revision(s)',
        longDescription: lines(
            'The reverse of each of the given revisions is applied sequentially in reverse topological order at the given location.',
            '',
            'The description of the new revisions can be customized with the `templates.revert_description` config variable.',
        ),
    },
    {name: 'root', description: 'Show the current workspace root directory (shortcut for `jj workspace root`)'},
    {name: 'show', description: 'Show commit description and changes in a revision'},
    {
        name: 'sign',
        description: 'Cryptographically sign a revision',
        longDescription: lines(
            'This command requires configuring a [commit signing] backend.',
            '',
            '[commit signing]: https://jj-vcs.github.io/jj/latest/config/#commit-signing',
        ),
    },
    {
        name: 'simplify-parents',
        description: 'Simplify parent edges for the specified revision(s)',
        longDescription: lines(
            'Removes all parents of each of the specified revisions that are also indirect ancestors of the same revisions through other',
            'parents. This has no effect on any revision\'s contents, including the working copy.',
            '',
            'In other words, for all (A, B, C) where A has (B, C) as parents and C is an ancestor of B, A will be rewritten to have only B as',
            'a parent instead of B+C.',
        ),
    },
    {name: 'sparse', description: 'Manage which paths from the working-copy commit are present in the working copy'},
    {
        name: 'split',
        description: 'Split a revision in two',
        longDescription: lines(
            'Starts a [diff editor] on the changes in the revision. Edit the right side of the diff until it has the content you want in the',
            'new revision. Once you close the editor, your edited content will replace the previous revision. The remaining changes will be put',
            'in a new revision on top.',
            '',
            '[diff editor]: https://jj-vcs.github.io/jj/latest/config/#editing-diffs',
            '',
            'If the change you split had a description, you will be asked to enter a change description for each commit. If the change did not',
            'have a description, the remaining changes will not get a description, and you will be asked for a description only for the',
            'selected changes.',
        ),
    },
    {
        name: 'squash',
        description: 'Move changes from a revision into another revision',
        longDescription: lines(
            'With the `-r` option, moves the changes from the specified revision to the parent revision. Fails if there are several parent',
            'revisions (i.e., the given revision is a merge).',
            '',
            'With the `--from` and/or `--into` options, moves changes from/to the given revisions. If either is left out, it defaults to the',
            'working-copy commit. For example, `jj squash --into @--` moves changes from the working-copy commit to the grandparent.',
            '',
            'If, after moving changes out, the source revision is empty compared to its parent(s), and `--keep-emptied` is not set, it will be',
            'abandoned. Without `--interactive` or paths, the source revision will always be empty.',
        ),
    },
    {
        name: 'status',
        description: 'Show high-level repo status',
        aliases: ['st'],
        longDescription: lines(
            'This includes:',
            '',
            '* The working copy commit and its parents, and a summary of the changes in the working copy (compared to the merged parents)',
            '',
            '* Conflicts in the working copy',
            '',
            '* [Conflicted bookmarks]',
            '',
            '[Conflicted bookmarks]: https://jj-vcs.github.io/jj/latest/bookmarks/#conflicts',
        ),
    },
    {name: 'tag', description: 'Manage tags'},
    {
        name: 'undo',
        description: 'Undo the last operation',
        longDescription: lines(
            'If used once after a normal (non-`undo`) operation, this will undo that last operation by restoring its parent. If `jj undo` is',
            'used repeatedly, it will restore increasingly older operations, going further back into the past.',
            '',
            'There is also a complementary `jj redo` command that would instead move in the direction of the future after one or more `jj undo`s.',
        ),
    },
    {
        name: 'unsign',
        description: 'Drop a cryptographic signature',
        longDescription: lines(
            'See also [commit signing] docs.',
            '',
            '[commit signing]: https://jj-vcs.github.io/jj/latest/config/#commit-signing',
        ),
    },
    {name: 'util', description: 'Infrequently used commands such as for generating shell completions'},
    {
        name: 'workspace',
        description: 'Commands for working with workspaces',
        longDescription: lines(
            'Workspaces let you add additional working copies attached to the same repo. A common use case is so you can run a slow build or',
            'test in one workspace while you\'re continuing to write code in another workspace.',
            '',
            'Each workspace has its own working-copy commit. When you have more than one workspace attached to a repo, they are indicated by',
            '`<workspace name>@` in `jj log`.',
            '',
            'Each workspace also has own sparse patterns.',
        ),
    },
]

const app = new App('Jujutsu (An experimental VCS)')
    .meta({
        bin: 'jj.exe',
        version: '0.34.0-22900c9a9ba362efa442fed2dd4e6e1d5c22cc7a',
        description: [
            'To get started, see the tutorial [`jj help -k tutorial`].',
            '',
            '[`jj help -k tutorial`]: https://jj-vcs.github.io/jj/latest/tutorial/',
        ].join('\n'),
    })

for(const spec of rootLeafSpecs) {
    app.command(leaf(spec))
}

app.command(fileCommand)

for(const option of globalOptions) {
    app.globalOpt(option.name, option)
}

if(import.meta.main) {
    await app.execute()
}
