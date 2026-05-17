export * from './HttpMethod'
export * from './HttpStatus'
export * from './StatusText'

import * as common from './common'

/**
 * Common HTTP constants.
 * @deprecated Import directly from @mpen/http-helpers/common
 */
export { common }

/** @deprecated Use {@link common.ContentType} instead */
export import CommonContentTypes = common.ContentType

/** @deprecated Use {@link common.HeaderName} instead */
export import CommonHeaders = common.HeaderName

/** @deprecated Use {@link common.MediaType} instead */
export import CommonMediaTypes = common.MediaType
