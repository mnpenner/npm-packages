import {ESLint} from "eslint"

type FixSummary = {
    count: number
    ruleId: string
}

function formatCount(word: string, count: number): string {
    return `${count} ${word}${count === 1 ? "" : "s"}`
}

const files = Bun.argv.slice(1)
const eslint = new ESLint({
    fix: true,
})
const dryRun = new ESLint({
    fix: false,
})

const targets = files.length > 0 ? files : ["."]
const beforeResults = await dryRun.lintFiles(targets)
const results = await eslint.lintFiles(targets)

await ESLint.outputFixes(results)

const fixedFiles = results.filter(result => result.output !== undefined)
const fixableByRule = new Map<string, number>()

for (const result of beforeResults) {
    for (const message of result.messages) {
        if (!message.fix) {
            continue
        }

        const ruleId = message.ruleId ?? "syntax"
        fixableByRule.set(ruleId, (fixableByRule.get(ruleId) ?? 0) + 1)
    }
}

if (fixedFiles.length === 0) {
    console.log("No autofixes applied.")
    process.exit(0)
}

const fixedMessageCount = [...fixableByRule.values()].reduce((sum, count) => sum + count, 0)
const summary: FixSummary[] = [...fixableByRule.entries()]
    .map(([ruleId, count]) => ({count, ruleId}))
    .sort((a, b) => b.count - a.count || a.ruleId.localeCompare(b.ruleId))

console.log(`Applied autofixes in ${formatCount("file", fixedFiles.length)}.`)

if (fixedMessageCount > 0) {
    console.log(`Fixable findings before write: ${formatCount("finding", fixedMessageCount)}.`)
    for (const item of summary.slice(0, 12)) {
        console.log(`  ${String(item.count).padStart(4, " ")}  ${item.ruleId}`)
    }

    if (summary.length > 12) {
        console.log(`  ... ${formatCount("more rule", summary.length - 12)}`)
    }
}
