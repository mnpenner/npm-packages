import type { RouteComponent } from '../../src'

type KitchenSinkParams = {
    foo: string
    baz: string
    splat: string
    optional?: string
    two?: string
}

const KitchenSink: RouteComponent<KitchenSinkParams> = ({ foo, baz, splat, optional, two }) => {
    return (
        <div>
            <div>foo: {foo}</div>
            <div>baz: {baz}</div>
            <div>splat: {splat}</div>
            <div>optional: {optional}</div>
            <div>two: {two}</div>
        </div>
    )
}

export default KitchenSink
