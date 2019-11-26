import React from 'react';
import {css} from 'styled-components';

declare global {
    const React: typeof React
    const DEBUG: boolean
}

declare module 'react' {
    interface HTMLAttributes<T> {
        /**
         * Sometimes you don't want to create an extra component just to apply a bit of styling. The css prop is a
         * convenient way to iterate on your components without settling on fixed component boundaries yet. It works on
         * both normal HTML tags as well as components, and supports everything any styled component supports,
         * including adapting based on props, theming and custom components.
         *
         * @see https://www.styled-components.com/docs/api#css-prop
         */
        css?: string|ReturnType<typeof css>
    }
}
