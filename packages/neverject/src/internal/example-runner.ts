import {stringWidth} from 'bun'

export type ExampleFn = () => void | Promise<void>
export type ExampleNode =
    | {type: 'example'; title: string; run: ExampleFn}
    | {type: 'describe'; title: string; children: ExampleNode[]}

const stack: ExampleNode[][] = [[]]
const rootExamples: ExampleNode[] = stack[0]!

function currentList(): ExampleNode[] {
    const list = stack[stack.length - 1]
    if(!list) throw new Error('Example stack is empty')
    return list
}

export function example(title: string, run: ExampleFn) {
    currentList().push({type: 'example', title, run})
}

export function describe(title: string, register: () => void) {
    const group: ExampleNode[] = []
    stack.push(group)
    register()
    stack.pop()
    currentList().push({type: 'describe', title, children: group})
}

export function log(label: string, value: unknown) {
    console.log(`${label}:`, value)
}

function renderDivider(title: string, width: number, char: string) {
    const label = ` ${title} `
    const labelWidth = stringWidth(label)
    const totalWidth = Math.max(labelWidth, width)
    const edgeWidth = Math.max(0, totalWidth - labelWidth)
    const left = char.repeat(Math.floor(edgeWidth / 2))
    const right = char.repeat(edgeWidth - left.length)

    console.log(`\n${left}${label}${right}`)
}

function describeDivider(title: string, level: number) {
    const width = process.stdout?.columns ?? 80
    const char = level === 0 ? '=' : '-'
    renderDivider(title, width, char)
}

function exampleDivider(title: string, level: number) {
    const fullWidth = process.stdout?.columns ?? 80
    const targetWidth = Math.min(fullWidth, 60)
    const width = Math.max(targetWidth, stringWidth(` ${title} `) + 4)
    const char = level === 0 ? '-' : '.'
    renderDivider(title, width, char)
}

export async function runExamples(list: ExampleNode[] = rootExamples, level = 0) {
    for(const item of list) {
        if(item.type === 'describe') {
            describeDivider(item.title, level)
            await runExamples(item.children, level + 1)
            continue
        }

        exampleDivider(item.title, level)
        await item.run()
    }

    if(level === 0) describeDivider('Done', level)
}
