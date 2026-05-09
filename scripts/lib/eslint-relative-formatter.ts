import path from 'node:path'
import util from 'node:util'

type LintMessage = {
    column?: number
    fatal?: boolean
    line?: number
    message: string
    ruleId?: string | null
    severity: number
}

type LintResult = {
    errorCount: number
    filePath: string
    fixableErrorCount: number
    fixableWarningCount: number
    messages: LintMessage[]
    warningCount: number
}

type FormatterData = {
    color?: boolean
    cwd?: string
}

function styleText(
    color: boolean | undefined,
    format: Parameters<typeof util.styleText>[0],
    text: string,
): string {
    if (color === false) {
        return text
    }

    return util.styleText(format, text, {
        validateStream: color === undefined,
    })
}

function pluralize(word: string, count: number): string {
    return count === 1 ? word : `${word}s`
}

export default function eslintRelativeFormatter(
    results: LintResult[],
    data: FormatterData,
): string {
    let errorCount = 0
    let warningCount = 0
    let fixableErrorCount = 0
    let fixableWarningCount = 0
    let output = ''
    const cwd = data.cwd ?? process.cwd()

    for (const result of results) {
        if (result.messages.length === 0) {
            continue
        }

        errorCount += result.errorCount
        warningCount += result.warningCount
        fixableErrorCount += result.fixableErrorCount
        fixableWarningCount += result.fixableWarningCount

        const relativePath = path.relative(cwd, result.filePath) || result.filePath
        output += `\n${styleText(data.color, 'magenta', relativePath)}\n`

        const rows = result.messages.map((message) => {
            const isError = message.fatal || message.severity === 2
            const level = isError
                ? styleText(data.color, 'red', 'error')
                : styleText(data.color, 'yellow', 'warning')
            const location = styleText(
                data.color,
                'dim',
                `${message.line || 0}:${message.column || 0}`,
            )
            const rule = message.ruleId ? styleText(data.color, 'dim', message.ruleId) : ''
            const text = message.message.replace(/([^ ])\.$/u, '$1')

            return { level, location, rule, text }
        })

        const locationWidth = Math.max(
            ...rows.map((row) => util.stripVTControlCharacters(row.location).length),
        )
        const levelWidth = Math.max(
            ...rows.map((row) => util.stripVTControlCharacters(row.level).length),
        )

        for (const row of rows) {
            const locationPad = ' '.repeat(
                locationWidth - util.stripVTControlCharacters(row.location).length,
            )
            const levelPad = ' '.repeat(
                levelWidth - util.stripVTControlCharacters(row.level).length,
            )

            output += `  ${locationPad}${row.location}  ${row.level}${levelPad}  ${row.text}`
            if (row.rule) {
                output += `  ${row.rule}`
            }
            output += '\n'
        }
    }

    const total = errorCount + warningCount

    if (total === 0) {
        return ''
    }

    const summaryColor = errorCount > 0 ? 'red' : 'yellow'

    output += `\n${styleText(
        data.color,
        summaryColor,
        styleText(
            data.color,
            'bold',
            [
                'x ',
                total,
                pluralize(' problem', total),
                ' (',
                errorCount,
                pluralize(' error', errorCount),
                ', ',
                warningCount,
                pluralize(' warning', warningCount),
                ')',
            ].join(''),
        ),
    )}\n`

    if (fixableErrorCount > 0 || fixableWarningCount > 0) {
        output += `${styleText(
            data.color,
            summaryColor,
            styleText(
                data.color,
                'bold',
                [
                    '  ',
                    fixableErrorCount,
                    pluralize(' error', fixableErrorCount),
                    ' and ',
                    fixableWarningCount,
                    pluralize(' warning', fixableWarningCount),
                    ' potentially fixable with the `--fix` option.',
                ].join(''),
            ),
        )}\n`
    }

    return styleText(data.color, 'reset', output)
}
