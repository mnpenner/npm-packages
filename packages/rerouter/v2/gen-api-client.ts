import * as ts from 'typescript'
import path from 'node:path'
import fs from 'node:fs'
import {parseArgs} from 'util'
import {URLPattern} from 'urlpattern-polyfill'
import {pattToName} from './router'

type ExtractedRouteMeta = {
    name: string
    method: string
    pattern: string
    bodyType: string
    pathType: string
    queryType: string
    successType: string
    errorType: string
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

function getHandlerTypeArguments(type: ts.Type): ts.Type[] | undefined {
    const ref = type as ts.TypeReference
    if (ref.typeArguments && ref.typeArguments.length === 4) {
        return ref.typeArguments
    }
    const aliasArgs = (type as any).aliasTypeArguments as ts.Type[] | undefined
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

                        const name = nameNode && ts.isStringLiteralLike(nameNode)
                            ? nameNode.text
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

function patternToUrlTemplate(pattern: string): string {
    const templated = pattern.replace(/:([a-zA-Z0-9_]+)/g, '${path.$1}')
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

type BuildOptions = {
    neverject: boolean
}

function buildApiClientSource(routes: ExtractedRouteMeta[], options: BuildOptions): string {
    const lines: string[] = []
    if (options.neverject) {
        lines.push(`import type { NeverjectPromise } from 'neverject'`)
        lines.push(``)
        lines.push(`export interface Fetcher<TErr> {`)
        lines.push(`    fetch<TOk>(url: string, init: RequestInit): NeverjectPromise<TOk, TErr>`)
        lines.push(`}`)
        lines.push(``)
        for (const route of routes) {
            const baseName = upperFirst(route.name)
            if (!isUnknown(route.pathType)) lines.push(`export type ${baseName}PathParams = ${route.pathType}`)
            if (!isUnknown(route.bodyType)) lines.push(`export type ${baseName}Request = ${route.bodyType}`)
            lines.push(`export type ${baseName}Response = ${route.successType}`)
            lines.push(``)
        }
        lines.push(`export class ApiClient<TErr> {`)
        lines.push(`    constructor(private readonly fetcher: Fetcher<TErr>) {}`)
        lines.push(``)
        for (const route of routes) {
            const baseName = upperFirst(route.name)
            const params: string[] = []
            const pathType = !isUnknown(route.pathType) ? `${baseName}PathParams` : undefined
            const bodyType = !isUnknown(route.bodyType) ? `${baseName}Request` : undefined
            if (pathType || /:[a-zA-Z0-9_]+/.test(route.pattern)) params.push(`path: ${pathType ?? 'any'}`)
            if (!isUnknown(route.queryType)) params.push(`query: ${route.queryType}`)
            if (bodyType) params.push(`body: ${bodyType}`)

            const urlExpr = patternToUrlTemplate(route.pattern)
            const returnType = `NeverjectPromise<${baseName}Response, TErr>`

            lines.push(`    ${route.name}(${params.join(', ')}): ${returnType} {`)
            lines.push(`        return this.fetcher.fetch<${baseName}Response>(${urlExpr}, {`)
            lines.push(`            method: "${route.method}",`)
            if (bodyType) {
                lines.push(`            body: JSON.stringify(body),`)
            }
            lines.push(`        })`)
            lines.push(`    }`)
            lines.push(``)
        }
        lines.push(`}`)
    } else {
        lines.push(`export interface Fetcher {`)
        lines.push(`    fetch(input: string, init: RequestInit): Promise<Response>`)
        lines.push(`}`)
        lines.push(``)
        lines.push(`export type TypedResponse<T> = Response & { json(): Promise<T> }`)
        lines.push(`export type PromisedResponse<T> = Promise<TypedResponse<T>>`)
        lines.push(``)
        for (const route of routes) {
            const baseName = upperFirst(route.name)
            if (!isUnknown(route.pathType)) lines.push(`export type ${baseName}PathParams = ${route.pathType}`)
            if (!isUnknown(route.bodyType)) lines.push(`export type ${baseName}Request = ${route.bodyType}`)
            lines.push(`export type ${baseName}Response = ${route.successType}`)
            lines.push(``)
        }
        lines.push(`export class ApiClient {`)
        lines.push(`    constructor(private readonly fetcher: Fetcher) {}`)
        lines.push(``)
        for (const route of routes) {
            const baseName = upperFirst(route.name)
            const params: string[] = []
            const pathType = !isUnknown(route.pathType) ? `${baseName}PathParams` : undefined
            const bodyType = !isUnknown(route.bodyType) ? `${baseName}Request` : undefined
            if (pathType || /:[a-zA-Z0-9_]+/.test(route.pattern)) params.push(`path: ${pathType ?? 'any'}`)
            if (!isUnknown(route.queryType)) params.push(`query: ${route.queryType}`)
            if (bodyType) params.push(`body: ${bodyType}`)

            const urlExpr = patternToUrlTemplate(route.pattern)
            const returnType = `PromisedResponse<${baseName}Response>`

            lines.push(`    ${route.name}(${params.join(', ')}): ${returnType} {`)
            lines.push(`        return this.fetcher.fetch(${urlExpr}, {`)
            lines.push(`            method: "${route.method}",`)
            if (bodyType) {
                lines.push(`            body: JSON.stringify(body),`)
            }
            lines.push(`        }) as ${returnType}`)
            lines.push(`    }`)
            lines.push(``)
        }
        lines.push(`}`)
    }
    return lines.join('\n')
    lines.push(`class ApiClient {`)
    lines.push(`    constructor(private readonly fetcher: Fetcher) {}`)
    lines.push(``)

    for (const route of routes) {
        const params: string[] = []
        if (!isUnknown(route.pathType)) params.push(`path: ${route.pathType}`)
        if (!isUnknown(route.queryType)) params.push(`query: ${route.queryType}`)
        if (!isUnknown(route.bodyType)) params.push(`body: ${route.bodyType}`)

        const urlExpr = patternToUrlTemplate(route.pattern)
        const returnType = options.neverject
            ? `NeverjectPromise<OkResponse<${route.successType}>, ErrResponse>`
            : `Promise<Response>`

        lines.push(`    ${route.name}(${params.join(', ')}): ${returnType} {`)
        lines.push(`        return this.fetcher.fetch(${urlExpr}, {`)
        lines.push(`            method: "${route.method}",`)
        if (!isUnknown(route.bodyType)) {
            lines.push(`            body: JSON.stringify(body),`)
        }
        lines.push(`        }) as unknown as ${returnType}`)
        lines.push(`    }`)
        lines.push(``)
    }

    lines.push(`}`)
    return lines.join('\n')
}

async function main() {
    const { positionals, values } = parseArgs({
        args: Bun.argv,
        allowPositionals: true,
        strict: true,
        options: {
            neverject: {
                type: 'boolean',
            },
        },
    })

    const [, , routerPathArg, outputPathArg] = positionals
    const useNeverject = Boolean((values as any).neverject)
    if (!routerPathArg) {
        console.error('Usage: bun run v2/gen-api-client.ts <router-file> [output-file] [--neverject]')
        process.exit(1)
    }

    const routerPath = path.resolve(routerPathArg)
    const tsconfigPath = path.resolve('tsconfig.json')
    const program = getProgramFromTsConfig(tsconfigPath, routerPath)
    const sourceFile = program.getSourceFile(routerPath)
    if (!sourceFile) {
        throw new Error(`Unable to load source file: ${routerPath}`)
    }

    const routes = extractRoutesFromSourceFile(sourceFile, program.getTypeChecker(), 'router')
    let errorType = routes.find(r => !isUnknown(r.errorType))?.errorType ?? 'unknown'
    if (errorType === 'RawError') {
        const baseDir = outputPathArg ? path.dirname(path.resolve(outputPathArg)) : path.dirname(routerPath)
        const rel = path.relative(baseDir, path.resolve(path.dirname(routerPath), 'create-zod-handler')).replace(/\\/g, '/')
        const normalized = rel.startsWith('.') ? rel : `./${rel}`
        errorType = `import("${normalized}").RawError`
    }
    const client = buildApiClientSource(routes, { neverject: useNeverject, errorType })

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
