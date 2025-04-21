export const HEX_LOWER = '0123456789abcdef'
export const HEX_UPPER = '0123456789ABCDEF'

/**
 * Designed to be conveniently and accurately transmitted between humans and computer systems
 * @see https://www.crockford.com/base32.html
 */
export const CROCKFORD32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/**
 * @see https://datatracker.ietf.org/doc/html/rfc4648#section-6
 */
export const BASE32_RFC4648 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export const BASE36_LOWER = '0123456789abcdefghijklmnopqrstuvwxyz'
export const BASE36_UPPER = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * Numbers and letters, excluding vowels. Makes it harder to accidentally include profanity.
 */
export const MPEN50 = '0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ'

export const BITCOIN58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/**
 * @see https://github.com/woltapp/blurhash/blob/712a47f946b98c30097eb1ada086ea00b18681ec/TypeScript/src/base83.ts#L2-L84
 */
export const BLURHASH83 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'

/**
 * All characters that can be encoded into JSON without escaping excluding multibyte chars.
 */
export const JSON94 = " !#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~"
/**
 * Letters, numbers, and symbols, but no quotes or spaces.
 */
export const PASSWORD = "!#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~"

export const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * @see https://datatracker.ietf.org/doc/html/rfc4648#section-4
 */
export const BASE64STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * @see https://datatracker.ietf.org/doc/html/rfc4648#section-5
 */
export const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
