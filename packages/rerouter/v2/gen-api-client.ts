import * as ts from 'typescript'
import path from 'node:path'
import fs from 'node:fs'
import {parseArgs} from 'util'
import {URLPattern} from 'urlpattern-polyfill'
import {fileURLToPath} from 'node:url'
import {pattToName} from './router'

type ExtractedRouteMeta = {
    name: string
    method: string
    pattern: string
    bodyType: string
    pathType: string
    queryType: string
    successType: string
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

function buildApiClientSource(routes: ExtractedRouteMeta[], importRawErrorFrom?: string): string {
    const lines: string[] = []
    lines.push(`import type { NeverjectPromise } from 'neverject'`)
    if (importRawErrorFrom) {
        lines.push(`import type { RawError } from '${importRawErrorFrom}'`)
    }
    lines.push(``)
    lines.push(`class ApiClient {`)
    lines.push(`    private readonly fetcher: Fetcher`)
    lines.push(``)
    lines.push(`    constructor(apiEndpoint: string) {`)
    lines.push(`        this.fetcher = new Fetcher({`)
    lines.push(`            baseUrl: apiEndpoint,`)
    lines.push(`            mode: 'cors',`)
    lines.push(`            credentials: 'include',`)
    lines.push(`        })`)
    lines.push(`    }`)
    lines.push(``)

    for (const route of routes) {
        const params: string[] = []
        if (!isUnknown(route.pathType)) params.push(`path: ${route.pathType}`)
        if (!isUnknown(route.queryType)) params.push(`query: ${route.queryType}`)
        if (!isUnknown(route.bodyType)) params.push(`body: ${route.bodyType}`)

        const urlExpr = patternToUrlTemplate(route.pattern)
        const returnType = `NeverjectPromise<${route.successType}, RawError>`

        lines.push(`    ${route.name}(${params.join(', ')}): ${returnType} {`)
        lines.push(`        return this.fetcher.request<${route.successType}>({`)
        lines.push(`            url: ${urlExpr},`)
        lines.push(`            method: "${route.method}",`)
        if (!isUnknown(route.bodyType)) {
            lines.push(`            body: JSON.stringify(body),`)
        }
        if (!isUnknown(route.queryType)) {
            lines.push(`            query,`)
        }
        lines.push(`        }) as ${returnType}`)
        lines.push(`    }`)
        lines.push(``)
    }

    lines.push(`}`)
    return lines.join('\n')
}

function resolveRawErrorImport(outputPath: string | undefined): string | undefined {
    if (!outputPath) return undefined
    const outputDir = path.dirname(outputPath)
    const rel = path.relative(outputDir, path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'create-zod-handler'))
    const normalized = rel.startsWith('.') ? rel : `./${rel}`
    return normalized.replace(/\\/g, '/')
}

async function main() {
    const { positionals } = parseArgs({
        args: Bun.argv,
        allowPositionals: true,
        strict: true,
        options: {},
    })

    const [, , routerPathArg, outputPathArg] = positionals
    if (!routerPathArg) {
        console.error('Usage: bun run v2/gen-api-client.ts <router-file> [output-file]')
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
    const rawErrorImport = resolveRawErrorImport(outputPathArg ? path.resolve(outputPathArg) : undefined)
    const client = buildApiClientSource(routes, rawErrorImport)

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
