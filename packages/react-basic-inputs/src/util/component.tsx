import type {Attributes, ComponentType, FC} from "react";
import type {Optionalize} from "../types/utility";


export function withDefaultProps<P>(Component: ComponentType<P>, defaultProps: Partial<P>, displayName?: string): FC<Optionalize<P, typeof defaultProps>> {
    const c = (props: Optionalize<P, typeof defaultProps>) => {
        const combinedProps = {...defaultProps, ...props} as P & Attributes
        return <Component {...combinedProps} />;
    };
    if (import.meta.env.NODE_ENV === 'development' && displayName) {
        c.displayName = displayName
    }
    return c
}
