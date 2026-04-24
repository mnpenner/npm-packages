
export function resolveUrl(from: string, to: string) {
    // Copied from https://nodejs.org/api/url.html#urlresolvefrom-to
    const resolvedUrl = new URL(to, new URL(from, `resolve://`));
    if (resolvedUrl.protocol === `resolve:`) {
        // `from` is a relative URL.
        const { pathname, search, hash } = resolvedUrl;
        return pathname + search + hash;
    }
    return resolvedUrl.toString();
}
