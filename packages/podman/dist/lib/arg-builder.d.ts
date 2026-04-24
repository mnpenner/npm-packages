export declare class ArgBuilder {
    private readonly args;
    constructor(command: string);
    addValue(flag: string, value?: string | number): void;
    addBool(flag: string, value?: boolean): void;
    addValues(flag: string, values?: string | string[]): void;
    add(arg: string): void;
    toArgs(): string[];
}
