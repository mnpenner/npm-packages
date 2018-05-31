

function notImplemented() {
    throw new Error("Not implemented");
}

export default class Command {
    
    
    constructor(options) {
        Object.assign(this, {
            name: '',
            description: '',
            options: [],
            arguments: [],
            helpText: '',
            execute: notImplemented,
        }, options);
    }
    
    addOption(opt) {
        this.options.push(opt);
        return this;
    }

    addArgument(arg) {
        this.arguments.push(arg);
        return this;
    }
}