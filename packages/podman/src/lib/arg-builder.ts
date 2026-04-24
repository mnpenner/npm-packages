export class ArgBuilder {
    private readonly args: string[]

    constructor(command: string) {
        this.args = [command]
    }

    addValue(flag: string, value?: string | number): void {
        if(value === undefined) return
        this.args.push(flag, String(value))
    }

    addBool(flag: string, value?: boolean): void {
        if(value === undefined) return
        if(value) {
            this.args.push(flag)
            return
        }
        this.args.push(`${flag}=false`)
    }

    addValues(flag: string, values?: string | string[]): void {
        if(!values) return
        const list = Array.isArray(values) ? values : [values]
        if(!list.length) return
        for(const value of list) {
            this.args.push(flag, value)
        }
    }

    add(arg: string): void {
        this.args.push(arg)
    }

    toArgs(): string[] {
        return [...this.args]
    }
}
