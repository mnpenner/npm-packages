#!/usr/bin/env -S bun
import * as ts from 'typescript'
import path from 'node:path'
import fs from 'node:fs'
import {parseArgs} from 'util'
import {$} from 'bun'
import {HttpMethod} from '@mpen/http-helpers'
import {pattToName, sanitizeNameParts, splitNameString} from '../route-names'

type ExtractedRouteMeta = {
    name: string[]
    method: HttpMethod
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

function findUp(startDir: string, fileName: string): string {
    let dir = startDir
    for (let i = 0; i < 20; i++) {
        const candidate = path.join(dir, fileName)
        if (fs.existsSync(candidate)) return candidate
        const parent = path.dirname(dir)
        if (parent === dir) break
        dir = parent
    }
    throw new Error(`Unable to find ${fileName} from ${startDir}`)
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
    if (ref.typeArguments && ref.typeArguments.length >= 4) {
        return ref.typeArguments
    }
    const aliasArgs = (type as any).aliasTypeArguments as readonly ts.Type[] | undefined
    if (aliasArgs && aliasArgs.length >= 4) {
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
    const flags =
        ts.TypeFormatFlags.NoTruncation
        | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
        | ts.TypeFormatFlags.UseFullyQualifiedType
    return node
        ? checker.typeToString(type, node, flags)
        : checker.typeToString(type, undefined as any, flags)
}

function getProp(node: ts.ObjectLiteralExpression, propName: string): ts.Expression | undefined {
    for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) && prop.name.getText() === propName) {
            return prop.initializer
        }
    }
    return undefined
}

function unwrapExpression(expr: ts.Expression): ts.Expression {
    let current = expr
    while (
        ts.isParenthesizedExpression(current)
        || ts.isAsExpression(current)
        || ts.isTypeAssertionExpression(current)
        || ts.isNonNullExpression(current)
    ) {
        current = current.expression
    }
    return current
}

function getContextualHandlerType(node: ts.Expression, checker: ts.TypeChecker): ts.Type | undefined {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        const contextual = checker.getContextualType(node)
        if (contextual) return contextual
    }
    return checker.getTypeAtLocation(node)
}

function getZodOutputType(type: ts.Type): ts.Type | undefined {
    const ref = type as ts.TypeReference
    if (ref.typeArguments && ref.typeArguments.length >= 1 && type.symbol?.getName() === 'ZodType') {
        return ref.typeArguments[0]
    }
    const aliasArgs = (type as any).aliasTypeArguments as ts.Type[] | undefined
    if (aliasArgs && aliasArgs.length >= 1 && type.aliasSymbol?.getName() === 'ZodType') {
        return aliasArgs[0]
    }
    const bases = type.getBaseTypes()
    if (bases) {
        for (const base of bases) {
            const found = getZodOutputType(base)
            if (found) return found
        }
    }
    return undefined
}

function getZodOutputTypeText(
    expr: ts.Expression | undefined,
    checker: ts.TypeChecker,
    fallbackNode?: ts.Node,
): string | undefined {
    if (!expr) return undefined
    const schemaType = checker.getTypeAtLocation(expr)
    const outputType = getZodOutputType(schemaType)
    if (!outputType) return undefined
    const text = typeText(outputType, checker, fallbackNode ?? expr)
    return isUnknown(text) ? undefined : text
}

function getJsonPayloadExpression(expr: ts.Expression): ts.Expression | undefined {
    const current = unwrapExpression(expr)
    if (ts.isCallExpression(current)) {
        const callee = current.expression
        if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'json') {
            const receiver = unwrapExpression(callee.expression)
            if (ts.isIdentifier(receiver) && receiver.text === 'Response') {
                return current.arguments[0]
            }
        }
    }
    if (ts.isNewExpression(current)) {
        const callee = current.expression
        if (ts.isIdentifier(callee) && callee.text === 'Response') {
            const [bodyArg] = current.arguments ?? []
            if (bodyArg && ts.isCallExpression(bodyArg)) {
                const stringifyCall = bodyArg.expression
                if (ts.isPropertyAccessExpression(stringifyCall) && stringifyCall.name.text === 'stringify') {
                    const receiver = unwrapExpression(stringifyCall.expression)
                    if (ts.isIdentifier(receiver) && receiver.text === 'JSON') {
                        return bodyArg.arguments[0]
                    }
                }
            }
        }
    }
    return undefined
}

function getHandlerJsonReturnType(node: ts.Expression, checker: ts.TypeChecker): ts.Type | undefined {
    if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) return undefined
    const payloadTypes: ts.Type[] = []
    const visitReturn = (expr: ts.Expression | undefined) => {
        if (!expr) return
        const payloadExpr = getJsonPayloadExpression(expr)
        if (!payloadExpr) return
        const payloadType = checker.getTypeAtLocation(payloadExpr)
        payloadTypes.push(payloadType)
    }

    if (ts.isBlock(node.body)) {
        const visitNode = (child: ts.Node) => {
            if (ts.isReturnStatement(child)) {
                visitReturn(child.expression)
                return
            }
            ts.forEachChild(child, visitNode)
        }
        ts.forEachChild(node.body, visitNode)
    } else {
        visitReturn(node.body)
    }

    if (payloadTypes.length === 0) return undefined
    if (payloadTypes.length === 1) return payloadTypes[0]
    return payloadTypes[0]
}

function resolveRouteOptionsExpression(
    expr: ts.Expression,
    checker: ts.TypeChecker,
    visited: Set<ts.Symbol> = new Set()
): ts.ObjectLiteralExpression | undefined {
    const current = unwrapExpression(expr)
    if (ts.isObjectLiteralExpression(current)) return current
    if (ts.isCallExpression(current)) {
        const [firstArg] = current.arguments
        return firstArg ? resolveRouteOptionsExpression(firstArg, checker, visited) : undefined
    }
    if (ts.isIdentifier(current) || ts.isPropertyAccessExpression(current)) {
        const symbol = getSymbolFromExpression(current, checker)
        if (!symbol || visited.has(symbol)) return undefined
        visited.add(symbol)
        for (const decl of symbol.declarations ?? []) {
            if (ts.isVariableDeclaration(decl) && decl.initializer) {
                const found = resolveRouteOptionsExpression(decl.initializer, checker, visited)
                if (found) return found
            }
            if (ts.isPropertyAssignment(decl) && decl.initializer) {
                const found = resolveRouteOptionsExpression(decl.initializer, checker, visited)
                if (found) return found
            }
            if (ts.isPropertyDeclaration(decl) && decl.initializer) {
                const found = resolveRouteOptionsExpression(decl.initializer, checker, visited)
                if (found) return found
            }
        }
    }
    return undefined
}

function readHttpMethod(expr: ts.Expression | undefined): HttpMethod | undefined {
    if (!expr) return undefined
    const current = unwrapExpression(expr)
    if (ts.isStringLiteralLike(current)) return current.text as HttpMethod
    if (ts.isPropertyAccessExpression(current)) return current.name.text as HttpMethod
    if (ts.isIdentifier(current)) return current.text as HttpMethod
    return undefined
}

function getPathParamNames(pattern: string): string[] {
    const matches = pattern.match(/:([a-zA-Z0-9_]+)/g) ?? []
    return matches.map(m => m.slice(1))
}

function getTypeTextOrFallback(type: ts.Type | undefined, checker: ts.TypeChecker, node?: ts.Node): string | undefined {
    if (!type) return undefined
    const text = typeText(type, checker, node)
    return isUnknown(text) ? undefined : text
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

function joinPrefixPathname(prefix: string, pathname: string): string {
    if (!prefix) return pathname
    if (!prefix.startsWith('/')) prefix = '/' + prefix
    if (prefix.endsWith('/')) prefix = prefix.slice(0, -1)
    if (pathname === '/') return prefix || '/'
    if (!pathname.startsWith('/')) pathname = '/' + pathname
    return (prefix + pathname) || '/'
}

function canonicalSymbol(symbol: ts.Symbol, checker: ts.TypeChecker): ts.Symbol {
    return (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol
}

function getSymbolFromExpression(expr: ts.Expression, checker: ts.TypeChecker): ts.Symbol | undefined {
    const sym = checker.getSymbolAtLocation(expr)
    return sym ? canonicalSymbol(sym, checker) : undefined
}

function extractRoutesFromRouterSymbol(
    routerSymbol: ts.Symbol,
    checker: ts.TypeChecker,
    prefix: string,
    visited: Map<ts.Symbol, Set<string>>,
): ExtractedRouteMeta[] {
    const routes: ExtractedRouteMeta[] = []

    const already = visited.get(routerSymbol)
    if (already?.has(prefix)) return routes
    if (already) already.add(prefix)
    else visited.set(routerSymbol, new Set([prefix]))

    const declarations = routerSymbol.declarations ?? []
    const sourceFiles = new Set<ts.SourceFile>()
    for (const decl of declarations) {
        sourceFiles.add(decl.getSourceFile())
    }

    const visit = (node: ts.Node, sourceFile: ts.SourceFile): void => {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
            const methodName = node.expression.name.text
            const receiverSym = getSymbolFromExpression(node.expression.expression, checker)
            if (!receiverSym || receiverSym !== routerSymbol) {
                ts.forEachChild(node, child => visit(child, sourceFile))
                return
            }

            if (methodName === 'add') {
                const [arg] = node.arguments
                const routeOptions = arg ? resolveRouteOptionsExpression(arg, checker) : undefined
                if (routeOptions) {
                    const methodNode = getProp(routeOptions, 'method')
                    const patternNode = getProp(routeOptions, 'pattern')
                    const nameNode = getProp(routeOptions, 'name')
                    const handlerNode = getProp(routeOptions, 'handler')
                    const bodySchemaNode = getProp(routeOptions, 'body')
                    const pathSchemaNode = getProp(routeOptions, 'pathParams')
                    const querySchemaNode = getProp(routeOptions, 'query')

                    const method = readHttpMethod(methodNode) ?? HttpMethod.GET
                    const localPattern = patternNode && ts.isStringLiteralLike(patternNode) ? patternNode.text : '/'
                    const pattern = joinPrefixPathname(prefix, localPattern)

                    const handlerType = handlerNode ? getContextualHandlerType(handlerNode, checker) : undefined
                    const typeArgs = handlerType ? getHandlerTypeArguments(handlerType) : undefined
                    const [bodyType, pathType, queryType, successType, errorTypeArg] = typeArgs ?? []
                    const errorType = errorTypeArg ?? (handlerType ? getHandlerErrorType(handlerType, checker) : undefined)
                    const handlerJsonReturnType = handlerNode ? getHandlerJsonReturnType(handlerNode, checker) : undefined

                    const explicitName = nameNode ? parseNameNode(nameNode) : undefined
                    const name = explicitName
                        ? sanitizeNameParts(explicitName)
                        : pattToName(method, { pathname: pattern } as any)

                    const bodyTypeText =
                        getTypeTextOrFallback(bodyType, checker, handlerNode)
                        ?? getZodOutputTypeText(bodySchemaNode, checker, routeOptions)
                        ?? 'unknown'
                    const pathTypeText =
                        getTypeTextOrFallback(pathType, checker, handlerNode)
                        ?? getZodOutputTypeText(pathSchemaNode, checker, routeOptions)
                        ?? 'unknown'
                    const queryTypeText =
                        getTypeTextOrFallback(queryType, checker, handlerNode)
                        ?? getZodOutputTypeText(querySchemaNode, checker, routeOptions)
                        ?? 'unknown'
                    const successTypeText =
                        getTypeTextOrFallback(successType, checker, handlerNode)
                        ?? getTypeTextOrFallback(handlerJsonReturnType, checker, handlerNode)
                        ?? 'unknown'
                    const errorTypeText = getTypeTextOrFallback(errorType, checker, handlerNode) ?? 'unknown'

                    routes.push({
                        name,
                        method,
                        pattern,
                        bodyType: bodyTypeText,
                        pathType: pathTypeText,
                        queryType: queryTypeText,
                        successType: successTypeText,
                        errorType: errorTypeText,
                    })
                }
            } else if (methodName === 'mount' || methodName === 'use') {
                const args = node.arguments
                const hasPrefix = methodName === 'mount' && args.length === 2 && ts.isStringLiteralLike(args[0]!)
                const childPrefix = hasPrefix ? (args[0] as ts.StringLiteralLike).text : ''
                const routerArg = methodName === 'mount'
                    ? (hasPrefix ? args[1] : args[0])
                    : (args.length >= 2 ? args[1] : undefined)

                if (routerArg) {
                    const childSym = getSymbolFromExpression(routerArg, checker)
                    if (childSym) {
                        routes.push(...extractRoutesFromRouterSymbol(
                            childSym,
                            checker,
                            joinPrefixPathname(prefix, childPrefix),
                            visited
                        ))
                    }
                }
            }
        }

        ts.forEachChild(node, child => visit(child, sourceFile))
    }

    for (const sf of sourceFiles) {
        visit(sf, sf)
    }

    return routes
}

function extractRoutesFromEntryFile(sourceFile: ts.SourceFile, checker: ts.TypeChecker, rootRouterName: string): ExtractedRouteMeta[] {
    let rootSymbol: ts.Symbol | undefined
    const findRoot = (node: ts.Node) => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === rootRouterName) {
            const sym = checker.getSymbolAtLocation(node.name)
            if (sym) rootSymbol = canonicalSymbol(sym, checker)
        }
        if (!rootSymbol) ts.forEachChild(node, findRoot)
    }
    findRoot(sourceFile)

    if (!rootSymbol) {
        throw new Error(`Unable to find router symbol for "${rootRouterName}" in ${sourceFile.fileName}`)
    }

    return extractRoutesFromRouterSymbol(rootSymbol, checker, '', new Map())
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
    return str.slice(0, 1).toUpperCase() + str.slice(1)
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

    const clientName = normalizeClientName((values as any)['client-name'])
    const responseType = ((values as any)['response-type'] as string | undefined)?.trim() || 'PromisedResponse'
    const importTypes = ((values as any)['import-type'] as string[] | undefined)?.map(parseImportTypeOption) ?? []

    const routerPath = path.resolve(routerPathArg)
    const tsconfigPath = findUp(import.meta.dir, 'tsconfig.json')
    const program = getProgramFromTsConfig(tsconfigPath, routerPath)
    const sourceFile =
        program.getSourceFile(routerPath)
        ?? program.getSourceFiles().find(sf => path.resolve(sf.fileName) === routerPath)
    if (!sourceFile) {
        throw new Error(`Unable to load source file: ${routerPath}`)
    }

    const routes = extractRoutesFromEntryFile(sourceFile, program.getTypeChecker(), 'router')
    const rawArgs = argv.slice(1)
    if (rawArgs[0] && path.isAbsolute(rawArgs[0])) {
        rawArgs[0] = path.relative(process.cwd(), rawArgs[0]).replace(/\\\\/g, '/')
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

if (import.meta.main) {
    main().catch(err => {
        console.error(err)
        process.exit(1)
    })
}
