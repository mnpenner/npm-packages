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
export const BASE63 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'

/**
 * @see https://datatracker.ietf.org/doc/html/rfc4648#section-4
 */
export const BASE64STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * @see https://datatracker.ietf.org/doc/html/rfc4648#section-5
 */
export const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/**
 * Base 85  : 4 bytes <-> 5 chars; MaxVal=2^32.047, WastedBits=0.047, Overhead=25%
 * TODO: This is JSON94 with the following 9 chars removed: [space]#%&'/`"?
 */
// export const BASE85 = "!$()*+,-.0123456789:;<=>@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~"

/**
 * @see https://en.wikipedia.org/wiki/Ascii85
 */
export const ASCII85 = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstu'

/**
 *  This set has been chosen with considerable care.  From the 94
 *  printable ASCII characters, the following nine were omitted:
 *
 *  '"' and "'", which allow the representation of IPv6 addresses to
 *  be quoted in other environments where some of the characters in
 *  the chosen character set may, unquoted, have other meanings.
 *
 *  ',' to allow lists of IPv6 addresses to conveniently be written,
 *  and '.' to allow an IPv6 address to end a sentence without
 *  requiring it to be quoted.
 *
 *  '/' so IPv6 addresses can be written in standard CIDR
 *  address/length notation, and ':' because that causes problems when
 *  used in mail headers and URLs.
 *
 *  '[' and ']', so those can be used to delimit IPv6 addresses when
 *  represented as text strings, as they often are for IPv4,
 *
 *  And last, '\', because it is often difficult to represent in a way
 *  where it does not appear to be a quote character, including in the
 *  source of this document.
 *
 * @see https://www.rfc-editor.org/rfc/rfc1924
 */
export const ASCII85_RFC1924 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~'

/**
 * These chars don't require escaping in URI components.
 */
export const URL71 = "!'()*-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~"

/**
 * These chars are valid in URLs.
 */
export const URL82 = "!#$&'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~"
