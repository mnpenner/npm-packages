export abstract class JsxNode {
    abstract toString(): string;
}

export function isJsxNode(x: any): x is JsxNode {
    return x instanceof JsxNode
}
