/**
 * Normalize a charset label to a lowercase "Preferred MIME Name" where possible.
 *
 * - Charset comparison is case-insensitive (IANA).
 * - Uses Preferred MIME Names when mapped.
 * - Unknown charsets return a cleaned lowercase form.
 */
export function normalizeCharsetName(input: string): string {
    if(!input?.length) return ''

    const raw = input.trim()
    if (raw.length === 0) return ''

    const keyA = normalizeKey(raw)
    const hitA = ALIAS_TO_PREFERRED_LOWER.get(keyA)
    if (hitA) return hitA

    // Secondary fuzzy match: ignore punctuation differences (utf8 vs utf-8)
    const keyB = stripKey(keyA)
    const hitB = STRIPPED_ALIAS_TO_PREFERRED_LOWER.get(keyB)
    if (hitB) return hitB

    // Fallback: normalized lowercase token
    return keyA
}

function normalizeKey(s: string): string {
    // IANA says comparison is case-insensitive; we normalize to lowercase. :contentReference[oaicite:4]{index=4}
    return s
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")          // drop internal spaces
        .replace(/_/g, "-")           // common alias form
}

function stripKey(s: string): string {
    // Keep only alnum for fuzzy matching across punctuation variants.
    return s.replace(/[^a-z0-9]+/g, "")
}

/**
 * Minimal, practical alias set.
 * Extend this map as needed (ideally generated from IANA CSV for full coverage). :contentReference[oaicite:5]{index=5}
 */
const ALIAS_TO_PREFERRED_LOWER = new Map<string, string>([
    // Unicode
    ["utf-8", "utf-8"],
    ["utf8", "utf-8"],
    ["unicode-1-1-utf-8", "utf-8"],

    ["utf-16", "utf-16"],
    ["utf16", "utf-16"],
    ["utf-16le", "utf-16le"],
    ["utf-16be", "utf-16be"],

    // ASCII
    ["us-ascii", "us-ascii"],
    ["ascii", "us-ascii"],
    ["ansi_x3.4-1968", "us-ascii"],
    ["ansi_x3.4-1986", "us-ascii"],
    ["iso646-us", "us-ascii"],
    ["cp367", "us-ascii"],
    ["ibm367", "us-ascii"],

    // ISO-8859 (Latin / Cyrillic / etc.)
    ["iso-8859-1", "iso-8859-1"],
    ["iso_8859-1:1987", "iso-8859-1"],
    ["iso_8859-1", "iso-8859-1"],
    ["latin1", "iso-8859-1"],
    ["l1", "iso-8859-1"],
    ["cp819", "iso-8859-1"],
    ["ibm819", "iso-8859-1"],

    ["iso-8859-2", "iso-8859-2"],
    ["latin2", "iso-8859-2"],
    ["l2", "iso-8859-2"],

    ["iso-8859-3", "iso-8859-3"],
    ["latin3", "iso-8859-3"],
    ["l3", "iso-8859-3"],

    ["iso-8859-4", "iso-8859-4"],
    ["latin4", "iso-8859-4"],
    ["l4", "iso-8859-4"],

    ["iso-8859-5", "iso-8859-5"],
    ["cyrillic", "iso-8859-5"],

    ["iso-8859-6", "iso-8859-6"],
    ["arabic", "iso-8859-6"],

    ["iso-8859-7", "iso-8859-7"],
    ["greek", "iso-8859-7"],
    ["greek8", "iso-8859-7"],

    ["iso-8859-8", "iso-8859-8"],
    ["hebrew", "iso-8859-8"],

    ["iso-8859-9", "iso-8859-9"],
    ["latin5", "iso-8859-9"],
    ["l5", "iso-8859-9"],

    // Common “windows” encodings
    ["windows-1252", "windows-1252"],
    ["cp1252", "windows-1252"],

    ["windows-1251", "windows-1251"],
    ["cp1251", "windows-1251"],

    // East Asian (common on the web)
    ["shift_jis", "shift_jis"],
    ["shift-jis", "shift_jis"],
    ["sjis", "shift_jis"],
    ["ms_kanji", "shift_jis"],

    ["euc-jp", "euc-jp"],
    ["eucjp", "euc-jp"],

    ["euc-kr", "euc-kr"],
    ["euckr", "euc-kr"],

    ["iso-2022-jp", "iso-2022-jp"],
    ["iso-2022-kr", "iso-2022-kr"],

    ["big5", "big5"],

    ["gbk", "gbk"],
    ["gb18030", "gb18030"],
])

const STRIPPED_ALIAS_TO_PREFERRED_LOWER = new Map<string, string>(
    Array.from(ALIAS_TO_PREFERRED_LOWER.entries(), ([k, v]) => [stripKey(k), v]),
)
