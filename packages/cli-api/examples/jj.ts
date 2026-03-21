#!/usr/bin/env bun
import {App, Command, OptType, type AnyOptType, type Option} from '../src'

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

function logRun(commandName: string) {
    return (args: unknown[], opts: Record<string, unknown>) => {
        console.log({command: commandName, args, opts})
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
        description: 'Path to repository to operate on',
    },
    {
        name: 'ignore-working-copy',
        type: OptType.BOOL,
        valueNotRequired: true,
        description: "Don't snapshot the working copy, and don't update it",
    },
    {
        name: 'ignore-immutable',
        type: OptType.BOOL,
        valueNotRequired: true,
        description: 'Allow rewriting immutable commits',
    },
    {
        name: 'at-operation',
        alias: 'at-op',
        valuePlaceholder: 'AT_OPERATION',
        description: 'Operation to load the repo at',
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
        description: 'Silence non-primary command output',
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
        description: 'Additional configuration options',
    },
    {
        name: 'config-file',
        repeatable: true,
        valuePlaceholder: 'PATH',
        description: 'Additional configuration files',
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
        longDescription: [
            'If the given path is a directory, files in the directory will be visited recursively.',
            '',
            'This example mirrors the structure of `jj file show --help`, but only logs parsed arguments.',
        ].join('\n'),
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
    {name: 'abandon', description: 'Abandon a revision'},
    {name: 'absorb', description: 'Move changes from a revision into the stack of mutable revisions'},
    {name: 'bisect', description: 'Find a bad revision by bisection'},
    {name: 'bookmark', description: 'Manage bookmarks', aliases: ['b']},
    {name: 'commit', description: 'Update the description and create a new change on top', aliases: ['ci']},
    {name: 'config', description: 'Manage config options'},
    {name: 'describe', description: 'Update the change description or other metadata', aliases: ['desc']},
    {name: 'diff', description: 'Compare file contents between two revisions'},
    {name: 'diffedit', description: 'Touch up the content changes in a revision with a diff editor'},
    {name: 'duplicate', description: 'Create new changes with the same content as existing ones'},
    {name: 'edit', description: 'Sets the specified revision as the working-copy revision'},
    {name: 'evolog', description: 'Show how a change has evolved over time', aliases: ['evolution-log']},
    {name: 'fix', description: 'Update files with formatting fixes or other changes'},
    {name: 'gerrit', description: 'Interact with Gerrit Code Review'},
    {name: 'git', description: 'Commands for working with Git remotes and the underlying Git repo'},
    {name: 'interdiff', description: 'Compare the changes of two commits'},
    {name: 'log', description: 'Show revision history'},
    {name: 'metaedit', description: 'Modify the metadata of a revision without changing its content'},
    {
        name: 'new',
        description: 'Create a new, empty change and (by default) edit it in the working copy',
        longDescription: [
            'By default, `jj` will edit the new change, making the working copy represent the new commit. This can be avoided with `--no-edit`.',
            '',
            'Note that you can create a merge commit by specifying multiple revisions as argument. For example, `jj new @ main` will create a new commit with the working copy and the `main` bookmark as parents.',
            '',
            'This example only logs parsed arguments and options.',
        ].join('\n'),
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
    {name: 'next', description: 'Move the working-copy commit to the child revision'},
    {name: 'operation', description: 'Commands for working with the operation log', aliases: ['op']},
    {name: 'parallelize', description: 'Parallelize revisions by making them siblings'},
    {name: 'prev', description: 'Change the working copy revision relative to the parent revision'},
    {name: 'rebase', description: 'Move revisions to different parent(s)'},
    {name: 'redo', description: 'Redo the most recently undone operation'},
    {name: 'resolve', description: 'Resolve conflicted files with an external merge tool'},
    {name: 'restore', description: 'Restore paths from another revision'},
    {name: 'revert', description: 'Apply the reverse of the given revision(s)'},
    {name: 'root', description: 'Show the current workspace root directory (shortcut for `jj workspace root`)'},
    {name: 'show', description: 'Show commit description and changes in a revision'},
    {name: 'sign', description: 'Cryptographically sign a revision'},
    {name: 'simplify-parents', description: 'Simplify parent edges for the specified revision(s)'},
    {name: 'sparse', description: 'Manage which paths from the working-copy commit are present in the working copy'},
    {name: 'split', description: 'Split a revision in two'},
    {name: 'squash', description: 'Move changes from a revision into another revision'},
    {name: 'status', description: 'Show high-level repo status', aliases: ['st']},
    {name: 'tag', description: 'Manage tags'},
    {name: 'undo', description: 'Undo the last operation'},
    {name: 'unsign', description: 'Drop a cryptographic signature'},
    {name: 'util', description: 'Infrequently used commands such as for generating shell completions'},
    {name: 'workspace', description: 'Commands for working with workspaces'},
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
