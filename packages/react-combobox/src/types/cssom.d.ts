interface HTMLElement {
    computedStyleMap?: () => StylePropertyMapReadOnly
}

interface StylePropertyMapReadOnly {
    readonly size: number
    get(prop: string): CSSUnitValue
}

interface CSSUnitValue {
    value: number
    unit: string
    to(unit: string): CSSUnitValue
}