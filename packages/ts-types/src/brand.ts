declare const BRAND: unique symbol

/**
 * @experimental
 */
export type Branded<TData, TBrand> = TData & {
    readonly [BRAND]: {
        readonly data: TData
        readonly brand: TBrand
    }
}

/**
 * @experimental
 */
export interface AnyBranded {
    readonly [BRAND]: {
        readonly data: unknown
        readonly brand: unknown
    }
}

/**
 * @experimental
 */
export type BrandData<T extends AnyBranded> = T[typeof BRAND]['data']

/**
 * @experimental
 */
export function makeBrand<TBranded extends AnyBranded>(): (value: BrandData<TBranded>) => TBranded

/**
 * @experimental
 */
export function makeBrand<TData, TBrand>(): (value: TData) => Branded<TData, TBrand>

export function makeBrand() {
    return (value: unknown) => value as never
}
