export interface AriaAttributes {
    /**
     * Roles define the semantic meaning of content, allowing screen readers and other tools to present and support
     * interaction with an object in a way that is consistent with user expectations of that type of object. roles are
     * added to HTML elements using role="role_type", where role_type is the name of a role in the ARIA specification.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles
     */
    role?: string
    [aria: `aria-${string}`]: string
}
