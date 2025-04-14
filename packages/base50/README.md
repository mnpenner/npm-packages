# Base Converter


## Fun bases

- Base64: Being a power of 2 makes it fast
- Base64url: The same, but doesn't use annoying characters
- Base58: Bitcoin
- Base94: Can be encoded into JSON without escaping
- Base50: All vowels removed makes it hard to product profane strings
- Base16: A classic
- Base83: Blurhash
    - First, 83 seems to be about how many low-ASCII characters you can find that are safe for use in all of JSON, HTML and shells.
    - Secondly, 83 * 83 is very close to, and a little more than, 19 * 19 * 19, making it ideal for encoding three AC components in two characters.
- Base36: Alphanumeric (0-9 + A-Z); compact and case-insensitive; often used for short IDs
- Base62: Alphanumeric (0-9 + A-Z + a-z); more compact than base36, but case-sensitive
- Base32: RFC 4648; safe for DNS and filenames 
- basE91: More compact than base64; designed for efficiency in ASCII encoding
    - Used in APRS (Amateur Packet Reporting System) for compact GPS and telemetry data transmission over radio.
- [base2048](https://github.com/qntm/base2048): optimised for transmitting data through Twitter
- [Base65536](https://github.com/qntm/base65536):  HATETRIS
    - optimised for UTF-32-encoded text,  uses only "safe" Unicode code points
    -  "Tweet length is measured by the number of codepoints in the NFC normalized version of the text.", not by counting the number of bytes in any specific encoding of the text. 


## TODO

Update BufferEncoder to have 2 encode and 3 decode methods.

1. Decode to bigint
2. Encode/decode the mathematical way (using carry) -- bigint seems faster than "streaming"
3. Encode/decode using the closest power of 2 (like base64)

Probably (3) should be a separate class. (1) and (2) are the same algo.
