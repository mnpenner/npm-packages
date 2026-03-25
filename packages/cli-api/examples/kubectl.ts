#!/usr/bin/env bun
import {App, Command, ExecutionContext, OptType, type AnyOptType, type Option} from '../src'

type ArgumentSpec = {
    name: string
    description?: string
    required?: boolean | number
    repeatable?: boolean | number
    defaultValue?: unknown
    defaultValueText?: string
    valuePlaceholder?: string
    type?: AnyOptType
}

type CommandSpec = {
    name: string
    description: string
    longDescription?: string
    aliases?: string[]
    options?: Option[]
    arguments?: ArgumentSpec[]
}

function lines(...parts: string[]): string {
    return parts.join('\n')
}

function logRun(commandName: string) {
    return (opts: Record<string, unknown>, ctx: ExecutionContext) => {
        console.log({
            command: commandName,
            opts,
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

function passthroughLeaf(name: string, description: string, longDescription?: string): Command {
    return leaf({
        name,
        description,
        longDescription,
        arguments: [
            {
                name: 'args',
                description: 'Positional arguments',
                repeatable: true,
            },
        ],
    })
}

const globalOptions: Option[] = [
    {
        name: 'as',
        valuePlaceholder: 'USER',
        defaultValueText: '\'\'',
        description: 'Username to impersonate for the operation. User could be a regular user or a service account in a namespace.',
    },
    {
        name: 'as-group',
        valuePlaceholder: 'GROUP',
        repeatable: true,
        defaultValueText: '[]',
        description: 'Group to impersonate for the operation, this flag can be repeated to specify multiple groups.',
    },
    {
        name: 'as-uid',
        valuePlaceholder: 'UID',
        defaultValueText: '\'\'',
        description: 'UID to impersonate for the operation.',
    },
    {
        name: 'cache-dir',
        valuePlaceholder: 'DIR',
        defaultValueText: '\'C:\\Users\\Mark\\.kube\\cache\'',
        defaultValue: 'C:\\Users\\Mark\\.kube\\cache',
        description: 'Default cache directory',
    },
    {
        name: 'certificate-authority',
        valuePlaceholder: 'FILE',
        defaultValueText: '\'\'',
        description: 'Path to a cert file for the certificate authority',
    },
    {
        name: 'client-certificate',
        valuePlaceholder: 'FILE',
        defaultValueText: '\'\'',
        description: 'Path to a client certificate file for TLS',
    },
    {
        name: 'client-key',
        valuePlaceholder: 'FILE',
        defaultValueText: '\'\'',
        description: 'Path to a client key file for TLS',
    },
    {
        name: 'cluster',
        valuePlaceholder: 'NAME',
        defaultValueText: '\'\'',
        description: 'The name of the kubeconfig cluster to use',
    },
    {
        name: 'context',
        valuePlaceholder: 'NAME',
        defaultValueText: '\'\'',
        description: 'The name of the kubeconfig context to use',
    },
    {
        name: 'disable-compression',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'If true, opt-out of response compression for all requests to the server',
    },
    {
        name: 'insecure-skip-tls-verify',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'If true, the server\'s certificate will not be checked for validity. This will make your HTTPS connections insecure',
    },
    {
        name: 'kubeconfig',
        valuePlaceholder: 'FILE',
        defaultValueText: '\'\'',
        description: 'Path to the kubeconfig file to use for CLI requests.',
    },
    {
        name: 'kuberc',
        valuePlaceholder: 'FILE',
        defaultValueText: '\'\'',
        description: 'Path to the kuberc file to use for preferences. This can be disabled by exporting KUBECTL_KUBERC=false feature gate or turning off the feature KUBERC=off.',
    },
    {
        name: 'log-flush-frequency',
        valuePlaceholder: 'DURATION',
        defaultValueText: '5s',
        defaultValue: '5s',
        description: 'Maximum number of seconds between log flushes',
    },
    {
        name: 'match-server-version',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'Require server version to match client version',
    },
    {
        name: 'namespace',
        alias: 'n',
        valuePlaceholder: 'NAMESPACE',
        defaultValueText: '\'\'',
        description: 'If present, the namespace scope for this CLI request',
    },
    {
        name: 'password',
        valuePlaceholder: 'PASSWORD',
        defaultValueText: '\'\'',
        description: 'Password for basic authentication to the API server',
    },
    {
        name: 'profile',
        type: OptType.ENUM,
        enumValues: ['none', 'cpu', 'heap', 'goroutine', 'threadcreate', 'block', 'mutex'],
        valuePlaceholder: 'NAME',
        defaultValueText: '\'none\'',
        defaultValue: 'none',
        description: 'Name of profile to capture',
    },
    {
        name: 'profile-output',
        valuePlaceholder: 'FILE',
        defaultValueText: '\'profile.pprof\'',
        defaultValue: 'profile.pprof',
        description: 'Name of the file to write the profile to',
    },
    {
        name: 'request-timeout',
        valuePlaceholder: 'DURATION',
        defaultValueText: '\'0\'',
        defaultValue: '0',
        description: 'The length of time to wait before giving up on a single server request. Non-zero values should contain a corresponding time unit (e.g. 1s, 2m, 3h). A value of zero means don\'t timeout requests.',
    },
    {
        name: 'server',
        alias: 's',
        valuePlaceholder: 'HOST',
        defaultValueText: '\'\'',
        description: 'The address and port of the Kubernetes API server',
    },
    {
        name: 'tls-server-name',
        valuePlaceholder: 'NAME',
        defaultValueText: '\'\'',
        description: 'Server name to use for server certificate validation. If it is not provided, the hostname used to contact the server is used',
    },
    {
        name: 'token',
        valuePlaceholder: 'TOKEN',
        defaultValueText: '\'\'',
        description: 'Bearer token for authentication to the API server',
    },
    {
        name: 'user',
        valuePlaceholder: 'NAME',
        defaultValueText: '\'\'',
        description: 'The name of the kubeconfig user to use',
    },
    {
        name: 'username',
        valuePlaceholder: 'USERNAME',
        defaultValueText: '\'\'',
        description: 'Username for basic authentication to the API server',
    },
    {
        name: 'v',
        alias: 'v',
        valuePlaceholder: 'LEVEL',
        defaultValueText: '0',
        defaultValue: '0',
        description: 'number for the log level verbosity',
    },
    {
        name: 'vmodule',
        valuePlaceholder: 'PATTERN=N,...',
        defaultValueText: '',
        description: 'comma-separated list of pattern=N settings for file-filtered logging (only works for the default text log format)',
    },
    {
        name: 'warnings-as-errors',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'Treat warnings received from the server as errors and exit with a non-zero exit code',
    },
]

const getOptions: Option[] = [
    {
        name: 'all-namespaces',
        alias: 'A',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'If present, list the requested object(s) across all namespaces. Namespace in current context is ignored even if specified with --namespace.',
    },
    {
        name: 'allow-missing-template-keys',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'true',
        defaultValue: true,
        description: 'If true, ignore any errors in templates when a field or map key is missing in the template. Only applies to golang and jsonpath output formats.',
    },
    {
        name: 'chunk-size',
        valuePlaceholder: 'SIZE',
        defaultValueText: '500',
        defaultValue: '500',
        description: 'Return large lists in chunks rather than all at once. Pass 0 to disable. This flag is beta and may change in the future.',
    },
    {
        name: 'field-selector',
        valuePlaceholder: 'SELECTOR',
        defaultValueText: '\'\'',
        description: 'Selector (field query) to filter on, supports \'=\', \'==\', and \'!=\'.(e.g. --field-selector key1=value1,key2=value2). The server only supports a limited number of field queries per type.',
    },
    {
        name: 'filename',
        alias: 'f',
        valuePlaceholder: 'FILE',
        repeatable: true,
        defaultValueText: '[]',
        description: 'Filename, directory, or URL to files identifying the resource to get from a server.',
    },
    {
        name: 'ignore-not-found',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'If set to true, suppresses NotFound error for specific objects that do not exist. Using this flag with commands that query for collections of resources has no effect when no resources are found.',
    },
    {
        name: 'kustomize',
        alias: 'k',
        valuePlaceholder: 'DIR',
        defaultValueText: '\'\'',
        description: 'Process the kustomization directory. This flag can\'t be used together with -f or -R.',
    },
    {
        name: 'label-columns',
        alias: 'L',
        valuePlaceholder: 'LABEL',
        repeatable: true,
        defaultValueText: '[]',
        description: 'Accepts a comma separated list of labels that are going to be presented as columns. Names are case-sensitive. You can also use multiple flag options like -L label1 -L label2...',
    },
    {
        name: 'no-headers',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'When using the default or custom-column output format, don\'t print headers (default print headers).',
    },
    {
        name: 'output',
        alias: 'o',
        valuePlaceholder: 'FORMAT',
        defaultValueText: '\'\'',
        description: 'Output format. One of: (json, yaml, name, go-template, go-template-file, template, templatefile, jsonpath, jsonpath-as-json, jsonpath-file, custom-columns, custom-columns-file, wide).',
    },
    {
        name: 'output-watch-events',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'Output watch event objects when --watch or --watch-only is used. Existing objects are output as initial ADDED events.',
    },
    {
        name: 'raw',
        valuePlaceholder: 'URI',
        defaultValueText: '\'\'',
        description: 'Raw URI to request from the server. Uses the transport specified by the kubeconfig file.',
    },
    {
        name: 'recursive',
        alias: 'R',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'Process the directory used in -f, --filename recursively. Useful when you want to manage related manifests organized within the same directory.',
    },
    {
        name: 'selector',
        alias: 'l',
        valuePlaceholder: 'SELECTOR',
        defaultValueText: '\'\'',
        description: 'Selector (label query) to filter on, supports \'=\', \'==\', \'!=\', \'in\', \'notin\'.(e.g. -l key1=value1,key2=value2,key3 in (value3)). Matching objects must satisfy all of the specified label constraints.',
    },
    {
        name: 'server-print',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'true',
        defaultValue: true,
        description: 'If true, have the server return the appropriate table output. Supports extension APIs and CRDs.',
    },
    {
        name: 'show-kind',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'If present, list the resource type for the requested object(s).',
    },
    {
        name: 'show-labels',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'When printing, show all labels as the last column (default hide labels column)',
    },
    {
        name: 'show-managed-fields',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'If true, keep the managedFields when printing objects in JSON or YAML format.',
    },
    {
        name: 'sort-by',
        valuePlaceholder: 'JSONPATH',
        defaultValueText: '\'\'',
        description: 'If non-empty, sort list types using this field specification. The field specification is expressed as a JSONPath expression (e.g. \'{.metadata.name}\'). The field in the API resource specified by this JSONPath expression must be an integer or a string.',
    },
    {
        name: 'subresource',
        valuePlaceholder: 'NAME',
        defaultValueText: '\'\'',
        description: 'If specified, gets the subresource of the requested object.',
    },
    {
        name: 'template',
        valuePlaceholder: 'TEMPLATE',
        defaultValueText: '\'\'',
        description: 'Template string or path to template file to use when -o=go-template, -o=go-template-file. The template format is golang templates.',
    },
    {
        name: 'watch',
        alias: 'w',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'After listing/getting the requested object, watch for changes.',
    },
    {
        name: 'watch-only',
        type: OptType.BOOL,
        valueNotRequired: true,
        defaultValueText: 'false',
        defaultValue: false,
        description: 'Watch for changes to the requested object(s), without listing/getting first.',
    },
]

const configCommand = new Command('config')
    .describe(
        'Modify kubeconfig files',
        lines(
            'Modify kubeconfig files using subcommands like "kubectl config set current-context my-context".',
            '',
            'The loading order follows these rules:',
            '',
            '1. If the --kubeconfig flag is set, then only that file is loaded.',
            '2. If $KUBECONFIG is set, those paths are merged.',
            '3. Otherwise, ${HOME}/.kube\\config is used.',
        ),
    )
    .command(passthroughLeaf('current-context', 'Display the current-context'))
    .command(passthroughLeaf('delete-cluster', 'Delete the specified cluster from the kubeconfig'))
    .command(passthroughLeaf('delete-context', 'Delete the specified context from the kubeconfig'))
    .command(passthroughLeaf('delete-user', 'Delete the specified user from the kubeconfig'))
    .command(passthroughLeaf('get-clusters', 'Display clusters defined in the kubeconfig'))
    .command(leaf({
        name: 'get-contexts',
        description: 'Describe one or many contexts',
        options: [
            {
                name: 'no-headers',
                type: OptType.BOOL,
                valueNotRequired: true,
                defaultValueText: 'false',
                defaultValue: false,
                description: 'When using the default or custom-column output format, don\'t print headers (default print headers).',
            },
            {
                name: 'output',
                alias: 'o',
                valuePlaceholder: 'FORMAT',
                defaultValueText: '\'\'',
                description: 'Output format. One of: (name).',
            },
        ],
        arguments: [
            {
                name: 'contexts',
                description: 'Context names',
                repeatable: true,
            },
        ],
    }))
    .command(passthroughLeaf('get-users', 'Display users defined in the kubeconfig'))
    .command(passthroughLeaf('rename-context', 'Rename a context from the kubeconfig file'))
    .command(passthroughLeaf('set', 'Set an individual value in a kubeconfig file'))
    .command(passthroughLeaf('set-cluster', 'Set a cluster entry in kubeconfig'))
    .command(passthroughLeaf('set-context', 'Set a context entry in kubeconfig'))
    .command(passthroughLeaf('set-credentials', 'Set a user entry in kubeconfig'))
    .command(passthroughLeaf('unset', 'Unset an individual value in a kubeconfig file'))
    .command(passthroughLeaf('use-context', 'Set the current-context in a kubeconfig file'))
    .command(passthroughLeaf('view', 'Display merged kubeconfig settings or a specified kubeconfig file'))

const rootLeafSpecs: CommandSpec[] = [
    {name: 'create', description: 'Create a resource from a file or from stdin'},
    {name: 'expose', description: 'Take a replication controller, service, deployment or pod and expose it as a new Kubernetes service'},
    {name: 'run', description: 'Run a particular image on the cluster'},
    {name: 'set', description: 'Set specific features on objects'},
    {name: 'explain', description: 'Get documentation for a resource'},
    {
        name: 'get',
        description: 'Display one or many resources',
        longDescription: lines(
            'Prints a table of the most important information about the specified resources.',
            '',
            'Use "kubectl api-resources" for a complete list of supported resources.',
        ),
        options: getOptions,
        arguments: [
            {
                name: 'resources',
                description: 'Resource type, name, or resource/name arguments',
                repeatable: true,
            },
        ],
    },
    {name: 'edit', description: 'Edit a resource on the server'},
    {name: 'delete', description: 'Delete resources by file names, stdin, resources and names, or by resources and label selector'},
    {name: 'rollout', description: 'Manage the rollout of a resource'},
    {name: 'scale', description: 'Set a new size for a deployment, replica set, or replication controller'},
    {name: 'autoscale', description: 'Auto-scale a deployment, replica set, stateful set, or replication controller'},
    {name: 'certificate', description: 'Modify certificate resources'},
    {name: 'cluster-info', description: 'Display cluster information'},
    {name: 'top', description: 'Display resource (CPU/memory) usage'},
    {name: 'cordon', description: 'Mark node as unschedulable'},
    {name: 'uncordon', description: 'Mark node as schedulable'},
    {name: 'drain', description: 'Drain node in preparation for maintenance'},
    {name: 'taint', description: 'Update the taints on one or more nodes'},
    {name: 'describe', description: 'Show details of a specific resource or group of resources'},
    {name: 'logs', description: 'Print the logs for a container in a pod'},
    {name: 'attach', description: 'Attach to a running container'},
    {name: 'exec', description: 'Execute a command in a container'},
    {name: 'port-forward', description: 'Forward one or more local ports to a pod'},
    {name: 'proxy', description: 'Run a proxy to the Kubernetes API server'},
    {name: 'cp', description: 'Copy files and directories to and from containers'},
    {name: 'auth', description: 'Inspect authorization'},
    {name: 'debug', description: 'Create debugging sessions for troubleshooting workloads and nodes'},
    {name: 'events', description: 'List events'},
    {name: 'diff', description: 'Diff the live version against a would-be applied version'},
    {name: 'apply', description: 'Apply a configuration to a resource by file name or stdin'},
    {name: 'patch', description: 'Update fields of a resource'},
    {name: 'replace', description: 'Replace a resource by file name or stdin'},
    {name: 'wait', description: 'Experimental: Wait for a specific condition on one or many resources'},
    {name: 'kustomize', description: 'Build a kustomization target from a directory or URL'},
    {name: 'label', description: 'Update the labels on a resource'},
    {name: 'annotate', description: 'Update the annotations on a resource'},
    {
        name: 'completion',
        description: 'Output shell completion code for the specified shell (bash, zsh, fish, or powershell)',
        arguments: [
            {
                name: 'shell',
                description: 'Shell to generate completion for',
                required: true,
                type: ['bash', 'zsh', 'fish', 'powershell'],
            },
        ],
    },
    {name: 'api-resources', description: 'Print the supported API resources on the server'},
    {name: 'api-versions', description: 'Print the supported API versions on the server, in the form of "group/version"'},
    {name: 'plugin', description: 'Provides utilities for interacting with plugins'},
    {name: 'version', description: 'Print the client and server version information'},
]

const app = new App('Kubernetes Control')
    .meta({
        bin: 'kubectl',
        version: 'v1.34.1',
        description: lines(
            'kubectl controls the Kubernetes cluster manager.',
            '',
            'Find more information at: https://kubernetes.io/docs/reference/kubectl/',
        ),
    })

for(const spec of rootLeafSpecs) {
    app.command(leaf(spec))
}

app.command(configCommand)
app.command(passthroughLeaf('convert.exe', 'The command convert.exe is a plugin installed by the user'))

for(const option of globalOptions) {
    app.globalOpt(option.name, option)
}

if(import.meta.main) {
    await app.execute()
}
