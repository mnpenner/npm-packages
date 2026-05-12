#!/usr/bin/env -S bun
import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'util'
import { $ } from 'bun'
import { compile } from 'json-schema-to-typescript'
import { HttpMethod } from '@mpen/http-helpers'
import type { JsonSchema, NormalizedRoute, RouteSchema } from '../types'

const DEFAULT_RESPONSE_TYPE = 'ApiResponsePromise'

type ExtractedRouteMeta = {
    name: string[]
    method: HttpMethod
    path: string
    requestSchema?: RouteSchema['request']
    responseBodySchemas?: Record<number, JsonSchema>
}

type ProcessedRouteMeta = ExtractedRouteMeta & {
    typeBase: string
    pathParams: string[]
}

type RouteNode = {
    routes: ProcessedRouteMeta[]
    children: Map<string, RouteNode>
}

type ImportType = {
    names: string[]
    module: string
}

type BuildOptions = {
    clientName: string
    responseType: string
    importTypes: ImportType[]
    commandText: string
}

type GeneratedRouteTypes = {
    route: ProcessedRouteMeta
    pathTypeSource?: string
    queryTypeSource?: string
    requestTypeSource?: string
    responseTypesByStatusSource?: string
    responseTypeSources: string[]
}

type RoutableModule = {
    getRoutes(): NormalizedRoute<any>[]
}

function printHelp(): void {
    console.log(`Usage: bun run packages/server-router/src/bin/gen-api-client.ts <router-file> [options]

Generate a typed API client from a server-router router module.

Arguments:
  router-file                 Router module that exports a router with getRoutes()

Options:
  -o, --output <file>         File to write. Prints to stdout when omitted.
  -w, --write                 Write to <router-file>.gen.ts beside the router file.
  -p, --pretty                Format written output with Prettier.
  --client-name <Name>        Generated client class name. Defaults to ApiClient.
  --import-type <Type:module> Import a type used by generated schemas. Can be repeated.
  --response-type <Type>      Generic response wrapper type. Defaults to ApiResponsePromise.
  --help                      Show this help message.`)
}

function routeTypeBaseName(route: ExtractedRouteMeta): string {
    const parts = route.name.length > 0 ? route.name : ['index']
    return upperFirst(route.method.toLowerCase()) + parts.map(upperFirst).join('')
}

function getPathParamNames(routePath: string): string[] {
    const matches = routePath.match(/:([a-zA-Z0-9_]+)/g) ?? []
    return matches.map((match) => match.slice(1))
}

function buildRouteTree(routes: ProcessedRouteMeta[]): RouteNode {
    const root: RouteNode = { routes: [], children: new Map() }
    for (const route of routes) {
        let node = root
        for (const segment of route.name) {
            if (!node.children.has(segment)) {
                node.children.set(segment, { routes: [], children: new Map() })
            }
            node = node.children.get(segment)!
        }
        node.routes.push(route)
    }
    return root
}

function classNameForParts(parts: string[], baseName: string): string {
    if (parts.length === 0) return baseName
    return `${baseName}_${parts.map(upperFirst).join('_')}`
}

function parseImportTypeOption(value: string): ImportType {
    const colonIdx = value.indexOf(':')
    if (colonIdx === -1) {
        throw new Error(`Invalid --import-type value: "${value}"`)
    }
    const names = value.slice(0, colonIdx)
    const module = value.slice(colonIdx + 1).trim()
    const parsedNames = names
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
    if (parsedNames.length === 0 || module.length === 0) {
        throw new Error(`Invalid --import-type value: "${value}"`)
    }
    return { names: parsedNames, module }
}

function normalizeClientName(name: string | undefined): string {
    if (!name) return 'ApiClient'
    return (
        name
            .replace(/[^A-Za-z0-9]+/g, ' ')
            .trim()
            .split(/\s+/)
            .map(upperFirst)
            .join('') || 'ApiClient'
    )
}

function upperFirst(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1)
}

function lowerFirst(str: string): string {
    return str.slice(0, 1).toLowerCase() + str.slice(1)
}

function patternToUrlTemplate(routePath: string, pathVar = 'path'): string {
    const templated = routePath.replace(
        /:([a-zA-Z0-9_]+)/g,
        `\${encodeURIComponent(String(${pathVar}.$1))}`,
    )
    if (templated.includes('${')) {
        return '`' + templated + '`'
    }
    return `"${routePath}"`
}

function isUnknown(text: string): boolean {
    return text === 'unknown' || text === 'any'
}

function normalizeMethod(routeMethod: NormalizedRoute<any>['method']): HttpMethod[] {
    if (!routeMethod) return [HttpMethod.GET]
    return Array.isArray(routeMethod) ? routeMethod : [routeMethod]
}

function extractRoutes(routes: NormalizedRoute<any>[]): ExtractedRouteMeta[] {
    const extracted: ExtractedRouteMeta[] = []
    for (const route of routes) {
        for (const method of normalizeMethod(route.method)) {
            extracted.push({
                name: route.name,
                method,
                path: route.path.pathname,
                ...(route.schema?.request ? { requestSchema: route.schema.request } : {}),
                ...(route.schema?.response?.body
                    ? { responseBodySchemas: route.schema.response.body }
                    : {}),
            })
        }
    }
    return extracted
}

function resolveRouterModule(module: Record<string, unknown>): RoutableModule {
    const candidates = [module.default, module.router, ...Object.values(module)]
    for (const candidate of candidates) {
        if (
            candidate &&
            typeof candidate === 'object' &&
            typeof (candidate as RoutableModule).getRoutes === 'function'
        ) {
            return candidate as RoutableModule
        }
    }
    throw new Error('Unable to find an exported router with a getRoutes() method')
}

async function loadRuntimeRoutes(routerPath: string): Promise<NormalizedRoute<any>[]> {
    const moduleUrl = pathToFileURL(routerPath).href
    const module = await import(moduleUrl)
    const router = resolveRouterModule(module as Record<string, unknown>)
    return router.getRoutes()
}

async function compileSchemaType(name: string, schema: JsonSchema): Promise<string> {
    return (
        await compile(schema as Record<string, unknown>, name, {
            bannerComment: '',
            style: {
                singleQuote: true,
            },
        })
    ).trim()
}

async function formatWithPrettier(source: string, outputPath: string): Promise<string> {
    let prettier
    try {
        prettier = await import('prettier')
    } catch (cause) {
        throw new Error('The --pretty option requires prettier to be installed.', { cause })
    }

    const options = (await prettier.resolveConfig(outputPath)) ?? {}
    return prettier.format(source, { ...options, filepath: outputPath })
}

function responseStatusAlias(typeBase: string, status: string): string {
    return `${typeBase}Response${status}`
}

async function generateRouteTypes(route: ProcessedRouteMeta): Promise<GeneratedRouteTypes> {
    const generated: GeneratedRouteTypes = {
        route,
        responseTypeSources: [],
    }

    if (route.requestSchema?.path) {
        generated.pathTypeSource = await compileSchemaType(
            `${route.typeBase}PathParams`,
            route.requestSchema.path,
        )
    }
    if (route.requestSchema?.query) {
        generated.queryTypeSource = await compileSchemaType(
            `${route.typeBase}Query`,
            route.requestSchema.query,
        )
    }
    if (route.requestSchema?.body !== undefined) {
        generated.requestTypeSource = await compileSchemaType(
            `${route.typeBase}Request`,
            route.requestSchema.body,
        )
    }

    if (route.responseBodySchemas && Object.keys(route.responseBodySchemas).length > 0) {
        const responseTypesByStatus: string[] = []
        for (const [status, responseSchema] of Object.entries(route.responseBodySchemas)) {
            const alias = responseStatusAlias(route.typeBase, status)
            generated.responseTypeSources.push(await compileSchemaType(alias, responseSchema))
            responseTypesByStatus.push(`    ${JSON.stringify(status)}: ${alias}`)
        }
        generated.responseTypesByStatusSource = [
            `export interface ${route.typeBase}ResponsesByStatus {`,
            ...responseTypesByStatus,
            `}`,
            `export type ${route.typeBase}Response = ${route.typeBase}ResponsesByStatus[keyof ${route.typeBase}ResponsesByStatus]`,
        ].join('\n')
    } else {
        const fallback = route.method === HttpMethod.HEAD ? 'never' : 'unknown'
        generated.responseTypesByStatusSource = `export type ${route.typeBase}Response = ${fallback}`
    }

    return generated
}

function buildMethodLines(
    route: ProcessedRouteMeta,
    options: BuildOptions,
    indent: string,
): string[] {
    const lines: string[] = []
    const methodName = route.method.toLowerCase()
    const bodyType =
        route.requestSchema?.body !== undefined ? `${route.typeBase}Request` : undefined
    const queryType = route.requestSchema?.query ? `${route.typeBase}Query` : undefined
    const hasPathParams = route.pathParams.length > 0
    const hasSinglePathParam = route.pathParams.length === 1
    let pathVar = 'path'

    if (hasPathParams) {
        if (hasSinglePathParam) {
            pathVar = '_path'
        }
    }

    const optionType = `${route.typeBase}Options`
    const hasRequiredOptions = hasPathParams || !!queryType || !!bodyType
    const shouldResolveApiResponse = options.responseType === DEFAULT_RESPONSE_TYPE
    const hasResponsesByStatus =
        !!route.responseBodySchemas && Object.keys(route.responseBodySchemas).length > 0
    const returnType =
        shouldResolveApiResponse && hasResponsesByStatus
            ? `ApiResponseByStatusPromise<${route.typeBase}ResponsesByStatus>`
            : `${options.responseType}<${route.typeBase}Response>`

    lines.push(
        `${indent}${methodName}(options: ${optionType}${hasRequiredOptions ? '' : ' = {}'}): ${returnType} {`,
    )
    if (hasRequiredOptions) {
        const destructured = [
            hasPathParams ? 'path' : undefined,
            queryType ? 'query' : undefined,
            bodyType ? 'body' : undefined,
            '...callOptions',
        ]
            .filter(Boolean)
            .join(', ')
        lines.push(`${indent}    const { ${destructured} } = options`)
    } else {
        lines.push(`${indent}    const callOptions = options`)
    }
    if (hasSinglePathParam) {
        lines.push(
            `${indent}    const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { ${route.pathParams[0]}: path } as any`,
        )
    }
    const urlExpr = patternToUrlTemplate(route.path, pathVar)
    const finalUrlExpr = queryType ? `withQuery(${urlExpr}, query)` : urlExpr
    const requestExpression = `this.transport.request<${route.typeBase}Response${bodyType ? `, ${bodyType}` : ''}>`
    const resolverExpression =
        shouldResolveApiResponse && hasResponsesByStatus
            ? `resolveApiResponseByStatus<${route.typeBase}ResponsesByStatus>`
            : 'resolveApiResponse'
    lines.push(
        `${indent}    return ${shouldResolveApiResponse ? `${resolverExpression}(` : ''}${requestExpression}({`,
    )
    lines.push(`${indent}        routeId: ${JSON.stringify(lowerFirst(route.typeBase))},`)
    lines.push(`${indent}        url: ${finalUrlExpr},`)
    lines.push(`${indent}        init: {`)
    lines.push(`${indent}            ...callOptions.init,`)
    lines.push(`${indent}            method: "${route.method}",`)
    lines.push(`${indent}            headers: callOptions.headers,`)
    lines.push(`${indent}            signal: callOptions.signal,`)
    lines.push(`${indent}        },`)
    if (bodyType) {
        lines.push(`${indent}        body,`)
    }
    lines.push(`${indent}        bodyCodec: callOptions.bodyCodec,`)
    if (shouldResolveApiResponse) {
        lines.push(`${indent}    }))`)
    } else {
        lines.push(`${indent}    }) as ${returnType}`)
    }
    lines.push(`${indent}}`)

    return lines
}

function buildOptionsSource(route: ProcessedRouteMeta): string {
    const lines: string[] = []
    const pathType = route.requestSchema?.path ? `${route.typeBase}PathParams` : undefined
    const bodyType =
        route.requestSchema?.body !== undefined ? `${route.typeBase}Request` : undefined
    const queryType = route.requestSchema?.query ? `${route.typeBase}Query` : undefined
    const hasPathParams = route.pathParams.length > 0
    const hasSinglePathParam = route.pathParams.length === 1

    lines.push(`export interface ${route.typeBase}Options extends ClientCallOptions {`)
    if (hasPathParams) {
        let pathParamType = pathType ?? 'any'
        if (hasSinglePathParam) {
            const singleParamType = pathType
                ? `SinglePathParam<${pathType}, "${route.pathParams[0]}">`
                : 'any'
            pathParamType = `${pathParamType} | ${singleParamType}`
        }
        lines.push(`    path: ${pathParamType}`)
    }
    if (queryType) lines.push(`    query: ${queryType}`)
    if (bodyType) lines.push(`    body: ${bodyType}`)
    lines.push(`}`)
    return lines.join('\n')
}

function emitClass(node: RouteNode, parts: string[], options: BuildOptions, lines: string[]): void {
    const className = classNameForParts(parts, options.clientName)
    const exportKeyword = parts.length === 0 ? 'export ' : ''

    lines.push(`${exportKeyword}class ${className} {`)
    if (parts.length === 0) {
        lines.push(`    private readonly transport: ClientTransport`)
        lines.push(``)
        lines.push(`    constructor(transport?: ClientTransport) {`)
        lines.push(`        this.transport = transport ?? new FetchTransport()`)
        lines.push(`    }`)
    } else {
        lines.push(`    constructor(private readonly transport: ClientTransport) {}`)
    }

    if (node.children.size > 0) {
        lines.push(``)
        const childNames = Array.from(node.children.keys())
        childNames.forEach((childName, idx) => {
            const childClass = classNameForParts([...parts, childName], options.clientName)
            lines.push(`    get ${childName}(): ${childClass} {`)
            lines.push(`        return new ${childClass}(this.transport)`)
            lines.push(`    }`)
            if (idx !== childNames.length - 1 || node.routes.length > 0) {
                lines.push(``)
            }
        })
    }

    if (node.routes.length > 0) {
        node.routes.forEach((route, idx) => {
            const methodLines = buildMethodLines(route, options, '    ')
            for (const line of methodLines) lines.push(line)
            if (idx !== node.routes.length - 1) lines.push(``)
        })
    }

    lines.push(`}`)
    lines.push(``)

    for (const [childName, childNode] of node.children) {
        emitClass(childNode, [...parts, childName], options, lines)
    }
}

async function buildApiClientSource(
    routes: ExtractedRouteMeta[],
    options: BuildOptions,
): Promise<string> {
    const processedRoutes: ProcessedRouteMeta[] = routes.map((route) => ({
        ...route,
        typeBase: routeTypeBaseName(route),
        pathParams: getPathParamNames(route.path),
    }))
    const needsSinglePathHelper = processedRoutes.some((route) => route.pathParams.length === 1)
    const needsQueryHelper = processedRoutes.some((route) => route.requestSchema?.query)
    const needsResponseByStatusHelper = processedRoutes.some(
        (route) => route.responseBodySchemas && Object.keys(route.responseBodySchemas).length > 0,
    )
    const needsDefaultResponsePromise = processedRoutes.some(
        (route) =>
            !route.responseBodySchemas || Object.keys(route.responseBodySchemas).length === 0,
    )
    const generatedTypes = await Promise.all(processedRoutes.map(generateRouteTypes))

    const lines: string[] = []
    lines.push(`// Do not modify this file. It was auto-generated with the following command:`)
    lines.push(`// $ ${options.commandText}`)
    lines.push(``)

    for (const importType of options.importTypes) {
        lines.push(`import type { ${importType.names.join(', ')} } from '${importType.module}'`)
    }

    const clientImports = [
        'FetchTransport',
        options.responseType === DEFAULT_RESPONSE_TYPE && needsDefaultResponsePromise
            ? 'resolveApiResponse'
            : undefined,
        options.responseType === DEFAULT_RESPONSE_TYPE && needsResponseByStatusHelper
            ? 'resolveApiResponseByStatus'
            : undefined,
        needsQueryHelper ? 'withQuery' : undefined,
        'type ClientCallOptions',
        'type ClientTransport',
        options.responseType === DEFAULT_RESPONSE_TYPE && needsResponseByStatusHelper
            ? 'type ApiResponseByStatusPromise'
            : undefined,
        options.responseType === DEFAULT_RESPONSE_TYPE && needsDefaultResponsePromise
            ? `type ${options.responseType}`
            : undefined,
    ].filter(Boolean)
    lines.push(`import { ${clientImports.join(', ')} } from '@mpen/server-router/client'`)

    if (options.importTypes.length > 0) {
        lines.push(``)
    }
    lines.push(``)

    if (needsSinglePathHelper) {
        lines.push(
            `type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V } ? V : unknown`,
        )
    }

    lines.push(``)
    for (const generated of generatedTypes) {
        if (generated.pathTypeSource && !isUnknown(generated.pathTypeSource))
            lines.push(generated.pathTypeSource, ``)
        if (generated.queryTypeSource && !isUnknown(generated.queryTypeSource))
            lines.push(generated.queryTypeSource, ``)
        if (generated.requestTypeSource && !isUnknown(generated.requestTypeSource))
            lines.push(generated.requestTypeSource, ``)
        for (const responseTypeSource of generated.responseTypeSources) {
            if (!isUnknown(responseTypeSource)) lines.push(responseTypeSource, ``)
        }
        if (generated.responseTypesByStatusSource)
            lines.push(generated.responseTypesByStatusSource, ``)
        lines.push(buildOptionsSource(generated.route), ``)
    }

    const tree = buildRouteTree(processedRoutes)
    emitClass(tree, [], options, lines)

    return lines.join('\n')
}

export async function main() {
    const { positionals, values } = parseArgs({
        allowPositionals: true,
        strict: true,
        options: {
            output: {
                type: 'string',
                short: 'o',
            },
            write: {
                type: 'boolean',
                short: 'w',
            },
            pretty: {
                type: 'boolean',
                short: 'p',
            },
            'client-name': {
                type: 'string',
            },
            'import-type': {
                type: 'string',
                multiple: true,
            },
            'response-type': {
                type: 'string',
            },
            help: {
                type: 'boolean',
            },
        },
    })

    if (values.help) {
        printHelp()
        return
    }

    const [routerPathArg] = positionals
    if (!routerPathArg) {
        printHelp()
        process.exit(1)
    }

    const clientName = normalizeClientName(
        (values as Record<string, string | string[] | undefined>)['client-name'] as
            | string
            | undefined,
    )
    const responseType =
        (
            (values as Record<string, string | string[] | undefined>)['response-type'] as
                | string
                | undefined
        )?.trim() || DEFAULT_RESPONSE_TYPE
    const importTypes =
        (
            (values as Record<string, string | string[] | undefined>)['import-type'] as
                | string[]
                | undefined
        )?.map(parseImportTypeOption) ?? []

    const routerPath = path.resolve(routerPathArg)
    let outputPath: string | undefined
    if (values.output) {
        outputPath = path.resolve(values.output as string)
    } else if (values.write) {
        outputPath = path.join(
            path.dirname(routerPath),
            `${path.basename(routerPath, path.extname(routerPath))}.gen.ts`,
        )
    }

    const routes = extractRoutes(await loadRuntimeRoutes(routerPath))
    const rawArgs = process.argv.slice(1)
    if (rawArgs[0] && path.isAbsolute(rawArgs[0])) {
        rawArgs[0] = path.relative(process.cwd(), rawArgs[0]).replace(/\\/g, '/')
    }
    const commandText = ['bun', ...rawArgs.map((arg) => $.escape(arg))].join(' ')

    let client = await buildApiClientSource(routes, {
        clientName,
        responseType,
        importTypes,
        commandText,
    })

    if (outputPath) {
        if (values.pretty) {
            client = await formatWithPrettier(client, outputPath)
        }
        fs.writeFileSync(outputPath, client, 'utf8')
        console.log(`Wrote API client to ${path.relative(process.cwd(), outputPath)}`)
    } else {
        console.log(client)
    }
}

if (import.meta.main) {
    main().catch((err) => {
        console.error(err)
        process.exit(1)
    })
}
