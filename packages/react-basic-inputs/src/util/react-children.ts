import type { ReactElement, ReactNode} from 'react';
import {Children, isValidElement} from 'react'
import {isIterable} from "@mpen/is-type"


type MaybeChildrenProps = {children?: ReactNode}
type ElementWithChildren = ReactElement<MaybeChildrenProps>

export function recursiveForEachChild(children: ReactNode, callback: (child: ElementWithChildren) => void) {
    Children.forEach(children, child => {
        if(isValidElement<MaybeChildrenProps>(child)) {
            callback(child)
            if(child.props.children) {
                recursiveForEachChild(child.props.children, callback)
            }
        }
    })
}

export function* iterateChildren(children: ReactNode): Generator<ElementWithChildren, void, unknown> {
    // This looks a lot simpler/cheaper than https://github.com/facebook/react/blob/935180c7e060e4d6e7868cef8f2e7c1b77cf8f7f/packages/react/src/ReactChildren.js#L146
    if(!children) return
    if(isValidElement<MaybeChildrenProps>(children)) {
        yield children
        yield* iterateChildren(children.props.children)
    } else if(isIterable(children)) {
        for (const child of children) {
            yield* iterateChildren(child);
        }
    }
}
