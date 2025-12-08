#!/usr/bin/env -S bun
import * as ts from 'typescript'
import path from 'node:path'
import fs from 'node:fs'
import {parseArgs} from 'util'
import {URLPattern} from 'urlpattern-polyfill'
import {$} from 'bun'
import {pattToName, sanitizeNameParts, splitNameString} from './router'

type ExtractedRouteMeta = {
    name: string[]
    method: string
    pattern: string
    bodyType: string
    pathType: string
    queryType: string
    successType: string
    errorType: string
}

type ProcessedRouteMeta = ExtractedRouteMeta & {
    typeBase: string
    pathParams: string[]
}

type RouteNode = {
    routes: ProcessedRouteMeta[]
    children: Map<string, RouteNode>
}

function getProgramFromTsConfig(tsconfigPath: string, extraRoot?: string): ts.Program {
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
    if (configFile.error) {
        throw new Error(`Failed to read tsconfig: ${configFile.error.messageText}`)
    }
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath))
    const rootNames = parsed.fileNames.includes(extraRoot ?? '')
        ? parsed.fileNames
        : extraRoot
            ? [...parsed.fileNames, extraRoot]
            : parsed.fileNames
    return ts.createProgram(rootNames, parsed.options)
}

function getHandlerTypeArguments(type: ts.Type): readonly ts.Type[] | undefined {
    const ref = type as ts.TypeReference
    if (ref.typeArguments && ref.typeArguments.length === 4) {
        return ref.typeArguments
    }
    const aliasArgs = (type as any).aliasTypeArguments as readonly ts.Type[] | undefined
    if (aliasArgs && aliasArgs.length === 4) {
        return aliasArgs
    }
    if (type.isUnion()) {
        for (const t of type.types) {
            const found = getHandlerTypeArguments(t)
            if (found) return found
        }
    }
    const bases = type.getBaseTypes()
    if (bases) {
        for (const base of bases) {
            const found = getHandlerTypeArguments(base)
            if (found) return found
        }
    }
    return undefined
}

function getHandlerErrorType(type: ts.Type, checker: ts.TypeChecker): ts.Type | undefined {
    const signatures = type.getCallSignatures()
    for (const sig of signatures) {
        const ret = checker.getReturnTypeOfSignature(sig)
        const ref = ret as ts.TypeReference
        const typeArgs = (ref.typeArguments ?? (ret as any).aliasTypeArguments) as ts.Type[] | undefined
        if (typeArgs && typeArgs.length >= 2) {
            return typeArgs[1]
        }
        if (ret.isUnion()) {
            for (const t of ret.types) {
                const inner = getHandlerErrorType(t, checker)
                if (inner) return inner
            }
        }
    }
    return undefined
}

function typeText(type: ts.Type, checker: ts.TypeChecker, node?: ts.Node): string {
    return checker.typeToString(
        type,
        node,
        ts.TypeFormatFlags.NoTruncation
        | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
        | ts.TypeFormatFlags.UseFullyQualifiedType
    )
}

function getProp(node: ts.ObjectLiteralExpression, propName: string): ts.Expression | undefined {
    for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) && prop.name.getText() === propName) {
            return prop.initializer
        }
    }
    return undefined
}

function getPathParamNames(pattern: string): string[] {
    const matches = pattern.match(/:([a-zA-Z0-9_]+)/g) ?? []
    return matches.map(m => m.slice(1))
}

function parseNameNode(nameNode: ts.Expression): string[] | undefined {
    if (ts.isStringLiteralLike(nameNode)) {
        return splitNameString(nameNode.text)
    }
    if (ts.isArrayLiteralExpression(nameNode)) {
        const parts: string[] = []
        for (const element of nameNode.elements) {
            if (ts.isStringLiteralLike(element)) {
                parts.push(element.text)
            } else {
                return undefined
            }
        }
        return parts
    }
    return undefined
}

function extractRoutesFromSourceFile(sourceFile: ts.SourceFile, checker: ts.TypeChecker, routerName: string): ExtractedRouteMeta[] {
    const routes: ExtractedRouteMeta[] = []

    const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
            if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'add') {
                if (ts.isIdentifier(node.expression.expression) && node.expression.expression.text === routerName) {
                    const [arg] = node.arguments
                    if (arg && ts.isObjectLiteralExpression(arg)) {
                        const methodNode = getProp(arg, 'method')
                        const patternNode = getProp(arg, 'pattern')
                        const nameNode = getProp(arg, 'name')
                        const handlerNode = getProp(arg, 'handler')

                        const method = methodNode && ts.isStringLiteralLike(methodNode) ? methodNode.text : 'GET'
                        const pattern = patternNode && ts.isStringLiteralLike(patternNode) ? patternNode.text : '/'

                        const handlerType = handlerNode ? checker.getTypeAtLocation(handlerNode) : undefined
                        const typeArgs = handlerType ? getHandlerTypeArguments(handlerType) : undefined
                        const errorType = handlerType ? getHandlerErrorType(handlerType, checker) : undefined
                        const [bodyType, pathType, queryType, successType] = typeArgs ?? []

                        const explicitName = nameNode ? parseNameNode(nameNode) : undefined
                        const name = explicitName
                            ? sanitizeNameParts(explicitName)
                            : pattToName(method, new URLPattern({ pathname: pattern }))

                        routes.push({
                            name,
                            method,
                            pattern,
                            bodyType: bodyType ? typeText(bodyType, checker, handlerNode) : 'unknown',
                            pathType: pathType ? typeText(pathType, checker, handlerNode) : 'unknown',
                            queryType: queryType ? typeText(queryType, checker, handlerNode) : 'unknown',
                            successType: successType ? typeText(successType, checker, handlerNode) : 'unknown',
                            errorType: errorType ? typeText(errorType, checker, handlerNode) : 'unknown',
                        })
                    }
                }
            }
        }
        ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return routes
}

function patternToUrlTemplate(pattern: string, pathVar = 'path'): string {
    const templated = pattern.replace(/:([a-zA-Z0-9_]+)/g, `\${${pathVar}.$1}`)
    if (templated.includes('${')) {
        return '`' + templated + '`'
    }
    return `"${pattern}"`
}

function isUnknown(text: string): boolean {
    return text === 'unknown' || text === 'any'
}

function upperFirst(str: string): string {
    return str.slice(0,1).toUpperCase() + str.slice(1)
}

function routeTypeBaseName(route: ExtractedRouteMeta): string {
    const parts = route.name.length > 0 ? route.name : ['index']
    return upperFirst(route.method.toLowerCase()) + parts.map(upperFirst).join('')
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

function parseImportTypeOption(value: string): ImportType {
    const colonIdx = value.indexOf(':')
    if (colonIdx === -1) {
        throw new Error(`Invalid --import-type value: "${value}"`)
    }
    const names = value.slice(0, colonIdx)
    const module = value.slice(colonIdx + 1).trim()
    const parsedNames = names.split(',').map(n => n.trim()).filter(Boolean)
    if (parsedNames.length === 0 || module.length === 0) {
        throw new Error(`Invalid --import-type value: "${value}"`)
    }
    return { names: parsedNames, module }
}

function normalizeClientName(name: string | undefined): string {
    if (!name) return 'ApiClient'
    const [cleaned] = sanitizeNameParts([name])
    return cleaned ?? 'ApiClient'
}

function buildMethodLines(route: ProcessedRouteMeta, options: BuildOptions, indent: string): string[] {
    const lines: string[] = []
    const methodName = route.method.toLowerCase()
    const pathType = !isUnknown(route.pathType) ? `${route.typeBase}PathParams` : undefined
    const bodyType = !isUnknown(route.bodyType) ? `${route.typeBase}Request` : undefined
    const queryType = !isUnknown(route.queryType) ? route.queryType : undefined
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
    const urlExpr = patternToUrlTemplate(route.pattern, pathVar)
    lines.push(`${indent}    return this.fetcher.fetch(${urlExpr}, {`)
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

function buildApiClientSource(routes: ExtractedRouteMeta[], options: BuildOptions): string {
    const processedRoutes: ProcessedRouteMeta[] = routes.map(route => ({
        ...route,
        typeBase: routeTypeBaseName(route),
        pathParams: getPathParamNames(route.pattern),
    }))
    const needsSinglePathHelper = processedRoutes.some(route => route.pathParams.length === 1)

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
        lines.push(`export type TypedResponse<T> = Response & { json(): Promise<T> }`)
        lines.push(`export type PromisedResponse<T> = Promise<TypedResponse<T>>`)
    }

    if (needsSinglePathHelper) {
        lines.push(``)
        lines.push(`type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V } ? V : unknown`)
    }

    lines.push(``)
    for (const route of processedRoutes) {
        if (!isUnknown(route.pathType)) lines.push(`export type ${route.typeBase}PathParams = ${route.pathType}`)
        if (!isUnknown(route.bodyType)) lines.push(`export type ${route.typeBase}Request = ${route.bodyType}`)
        lines.push(`export type ${route.typeBase}Response = ${route.successType}`)
        lines.push(``)
    }

    const tree = buildRouteTree(processedRoutes)
    emitClass(tree, [], options, lines)

    return lines.join('\n')
}

async function main() {
    const { positionals, values } = parseArgs({
        args: Bun.argv,
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
        console.error('Usage: bun run v2/gen-api-client.ts <router-file> [output-file] [--client-name <Name>] [--import-type "Type:module"] [--response-type <Type>]')
        process.exit(1)
    }

    const clientName = normalizeClientName((values as any)['client-name'])
    const responseType = ((values as any)['response-type'] as string | undefined)?.trim() || 'PromisedResponse'
    const importTypes = ((values as any)['import-type'] as string[] | undefined)?.map(parseImportTypeOption) ?? []

    const routerPath = path.resolve(routerPathArg)
    const tsconfigPath = path.resolve('tsconfig.json')
    const program = getProgramFromTsConfig(tsconfigPath, routerPath)
    const sourceFile = program.getSourceFile(routerPath)
    if (!sourceFile) {
        throw new Error(`Unable to load source file: ${routerPath}`)
    }

    const routes = extractRoutesFromSourceFile(sourceFile, program.getTypeChecker(), 'router')
    const rawArgs = Bun.argv.slice(1)
    if (rawArgs[0] && path.isAbsolute(rawArgs[0])) {
        rawArgs[0] = path.relative(process.cwd(), rawArgs[0]).replace(/\\/g, '/')
    }
    const commandText = ['bun', ...rawArgs.map(arg => $.escape(arg))].join(' ')
    const client = buildApiClientSource(routes, {
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

main().catch(err => {
    console.error(err)
    process.exit(1)
})
