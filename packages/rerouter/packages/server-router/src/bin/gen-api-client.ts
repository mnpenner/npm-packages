#!/usr/bin/env -S bun
import path from 'node:path'
import fs from 'node:fs'
import {pathToFileURL} from 'node:url'
import {parseArgs} from 'util'
import {$} from 'bun'
import {compile} from 'json-schema-to-typescript'
import {HttpMethod} from '@mpen/http-helpers'
import type {JsonSchema, NormalizedRoute, RouteSchema} from '../types'

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

function routeTypeBaseName(route: ExtractedRouteMeta): string {
    const parts = route.name.length > 0 ? route.name : ['index']
    return upperFirst(route.method.toLowerCase()) + parts.map(upperFirst).join('')
}

function getPathParamNames(routePath: string): string[] {
    const matches = routePath.match(/:([a-zA-Z0-9_]+)/g) ?? []
    return matches.map(match => match.slice(1))
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
    const parsedNames = names.split(',').map(name => name.trim()).filter(Boolean)
    if (parsedNames.length === 0 || module.length === 0) {
        throw new Error(`Invalid --import-type value: "${value}"`)
    }
    return { names: parsedNames, module }
}

function normalizeClientName(name: string | undefined): string {
    if (!name) return 'ApiClient'
    return name
        .replace(/[^A-Za-z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map(upperFirst)
        .join('') || 'ApiClient'
}

function upperFirst(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1)
}

function patternToUrlTemplate(routePath: string, pathVar = 'path'): string {
    const templated = routePath.replace(/:([a-zA-Z0-9_]+)/g, `\${${pathVar}.$1}`)
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
                ...(route.schema?.request ? {requestSchema: route.schema.request} : {}),
                ...(route.schema?.response?.body ? {responseBodySchemas: route.schema.response.body} : {}),
            })
        }
    }
    return extracted
}

function resolveRouterModule(module: Record<string, unknown>): RoutableModule {
    const candidates = [
        module.default,
        module.router,
        ...Object.values(module),
    ]
    for (const candidate of candidates) {
        if (candidate && typeof candidate === 'object' && typeof (candidate as RoutableModule).getRoutes === 'function') {
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
    return (await compile(schema as Record<string, unknown>, name, {
        bannerComment: '',
        style: {
            singleQuote: true,
        },
    })).trim()
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
        generated.pathTypeSource = await compileSchemaType(`${route.typeBase}PathParams`, route.requestSchema.path)
    }
    if (route.requestSchema?.query) {
        generated.queryTypeSource = await compileSchemaType(`${route.typeBase}Query`, route.requestSchema.query)
    }
    if (route.requestSchema?.body !== undefined) {
        generated.requestTypeSource = await compileSchemaType(`${route.typeBase}Request`, route.requestSchema.body)
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

function buildMethodLines(route: ProcessedRouteMeta, options: BuildOptions, indent: string): string[] {
    const lines: string[] = []
    const methodName = route.method.toLowerCase()
    const pathType = route.requestSchema?.path ? `${route.typeBase}PathParams` : undefined
    const bodyType = route.requestSchema?.body !== undefined ? `${route.typeBase}Request` : undefined
    const queryType = route.requestSchema?.query ? `${route.typeBase}Query` : undefined
    const hasPathParams = route.pathParams.length > 0
    const hasSinglePathParam = route.pathParams.length === 1
    let pathVar = 'path'

    const params: string[] = []
    if (hasPathParams) {
        let pathParamType = pathType ?? 'any'
        if (hasSinglePathParam) {
            const singleParamType = pathType ? `SinglePathParam<${pathType}, "${route.pathParams[0]}">` : 'any'
            pathParamType = `${pathParamType} | ${singleParamType}`
            pathVar = '_path'
        }
        params.push(`path: ${pathParamType}`)
    }
    if (queryType) params.push(`query: ${queryType}`)
    if (bodyType) params.push(`body: ${bodyType}`)

    const returnType = `${options.responseType}<${route.typeBase}Response>`

    lines.push(`${indent}${methodName}(${params.join(', ')}) {`)
    if (hasSinglePathParam) {
        lines.push(`${indent}    const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { ${route.pathParams[0]}: path } as any`)
    }
    const urlExpr = patternToUrlTemplate(route.path, pathVar)
    const finalUrlExpr = queryType ? `withQuery(${urlExpr}, query)` : urlExpr
    lines.push(`${indent}    return this.fetcher.fetch(${finalUrlExpr}, {`)
    lines.push(`${indent}        method: "${route.method}",`)
    if (bodyType) {
        lines.push(`${indent}        headers: { "content-type": "application/json" },`)
        lines.push(`${indent}        body: JSON.stringify(body),`)
    }
    lines.push(`${indent}    }) as ${returnType}`)
    lines.push(`${indent}}`)

    return lines
}

function emitClass(node: RouteNode, parts: string[], options: BuildOptions, lines: string[]): void {
    const className = classNameForParts(parts, options.clientName)
    const exportKeyword = parts.length === 0 ? 'export ' : ''

    lines.push(`${exportKeyword}class ${className} {`)
    lines.push(`    constructor(private readonly fetcher: Fetcher) {}`)

    if (node.children.size > 0) {
        lines.push(``)
        const childNames = Array.from(node.children.keys())
        childNames.forEach((childName, idx) => {
            const childClass = classNameForParts([...parts, childName], options.clientName)
            lines.push(`    get ${childName}(): ${childClass} {`)
            lines.push(`        return new ${childClass}(this.fetcher)`)
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

async function buildApiClientSource(routes: ExtractedRouteMeta[], options: BuildOptions): Promise<string> {
    const processedRoutes: ProcessedRouteMeta[] = routes.map(route => ({
        ...route,
        typeBase: routeTypeBaseName(route),
        pathParams: getPathParamNames(route.path),
    }))
    const needsSinglePathHelper = processedRoutes.some(route => route.pathParams.length === 1)
    const needsQueryHelper = processedRoutes.some(route => route.requestSchema?.query)
    const generatedTypes = await Promise.all(processedRoutes.map(generateRouteTypes))

    const lines: string[] = []
    lines.push(`// Do not modify this file. It was auto-generated with the following command:`)
    lines.push(`// $ ${options.commandText}`)
    lines.push(``)

    for (const importType of options.importTypes) {
        lines.push(`import type { ${importType.names.join(', ')} } from '${importType.module}'`)
    }

    if (options.importTypes.length > 0) {
        lines.push(``)
    }

    lines.push(`export interface Fetcher {`)
    lines.push(`    fetch(url: string, init: RequestInit): unknown`)
    lines.push(`}`)

    const usesDefaultResponseType = options.responseType === 'PromisedResponse'
    if (usesDefaultResponseType) {
        lines.push(``)
        lines.push(`export type TypedResponse<T> = Omit<Response, 'json'> & { json(): Promise<T> }`)
        lines.push(`export type PromisedResponse<T> = Promise<TypedResponse<T>>`)
    }

    if (needsSinglePathHelper) {
        lines.push(``)
        lines.push(`type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V } ? V : unknown`)
    }

    if (needsQueryHelper) {
        lines.push(``)
        lines.push(`function withQuery(url: string, query: Record<string, unknown>): string {`)
        lines.push(`    const searchParams = new URLSearchParams()`)
        lines.push(`    for (const [key, value] of Object.entries(query)) {`)
        lines.push(`        if (value == null) continue`)
        lines.push(`        if (Array.isArray(value)) {`)
        lines.push(`            for (const item of value) {`)
        lines.push(`                if (item != null) searchParams.append(key, typeof item === 'object' ? JSON.stringify(item) : String(item))`)
        lines.push(`            }`)
        lines.push(`            continue`)
        lines.push(`        }`)
        lines.push(`        searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))`)
        lines.push(`    }`)
        lines.push(`    const search = searchParams.toString()`)
        lines.push(`    return search.length > 0 ? \`\${url}?\${search}\` : url`)
        lines.push(`}`)
    }

    lines.push(``)
    for (const generated of generatedTypes) {
        if (generated.pathTypeSource && !isUnknown(generated.pathTypeSource)) lines.push(generated.pathTypeSource, ``)
        if (generated.queryTypeSource && !isUnknown(generated.queryTypeSource)) lines.push(generated.queryTypeSource, ``)
        if (generated.requestTypeSource && !isUnknown(generated.requestTypeSource)) lines.push(generated.requestTypeSource, ``)
        for (const responseTypeSource of generated.responseTypeSources) {
            if (!isUnknown(responseTypeSource)) lines.push(responseTypeSource, ``)
        }
        if (generated.responseTypesByStatusSource) lines.push(generated.responseTypesByStatusSource, ``)
    }

    const tree = buildRouteTree(processedRoutes)
    emitClass(tree, [], options, lines)

    return lines.join('\n')
}

export async function main(argv: string[] = Bun.argv) {
    const { positionals, values } = parseArgs({
        args: argv,
        allowPositionals: true,
        strict: true,
        options: {
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
        },
    })

    const [, , routerPathArg, outputPathArg] = positionals
    if (!routerPathArg) {
        console.error('Usage: bun run packages/server-router/src/bin/gen-api-client.ts <router-file> [output-file] [--client-name <Name>] [--import-type "Type:module"] [--response-type <Type>]')
        process.exit(1)
    }

    const clientName = normalizeClientName((values as Record<string, string | string[] | undefined>)['client-name'] as string | undefined)
    const responseType = ((values as Record<string, string | string[] | undefined>)['response-type'] as string | undefined)?.trim() || 'PromisedResponse'
    const importTypes = ((values as Record<string, string | string[] | undefined>)['import-type'] as string[] | undefined)?.map(parseImportTypeOption) ?? []

    const routerPath = path.resolve(routerPathArg)
    const routes = extractRoutes(await loadRuntimeRoutes(routerPath))
    const rawArgs = argv.slice(1)
    if (rawArgs[0] && path.isAbsolute(rawArgs[0])) {
        rawArgs[0] = path.relative(process.cwd(), rawArgs[0]).replace(/\\/g, '/')
    }
    const commandText = ['bun', ...rawArgs.map(arg => $.escape(arg))].join(' ')

    const client = await buildApiClientSource(routes, {
        clientName,
        responseType,
        importTypes,
        commandText,
    })

    if (outputPathArg) {
        const outputPath = path.resolve(outputPathArg)
        fs.writeFileSync(outputPath, client, 'utf8')
        console.log(`Wrote API client to ${outputPath}`)
    } else {
        console.log(client)
    }
}

if (import.meta.main) {
    main().catch(err => {
        console.error(err)
        process.exit(1)
    })
}
