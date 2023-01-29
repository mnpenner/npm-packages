import {escBash, escDash} from './index'


const ASCII_CHARS = Array.from({length:128}, (_,i) => String.fromCodePoint(i)).join('')

test(escBash.name, () => {
    expect(escBash`cmd ${'abc'}`).toBe(`cmd abc`)
    expect(escBash`cmd ${''}`).toBe(`cmd ''`)
    expect(escBash`cmd ${Math.PI}`).toBe(`cmd 3.141592653589793`)
    expect(escBash`cmd ${['foo','bar']}`).toBe(`cmd foo bar`)
    expect(escBash`cmd ${'foo bar'}`).toBe(`cmd $'foo bar'`)
    expect(escBash`cmd ${ASCII_CHARS}`).toBe("cmd $'\\x00\\x01\\x02\\x03\\x04\\x05\\x06\\a\\b\\t\\n\\v\\f\\r\\x0e\\x0f\\x10\\x11\\x12\\x13\\x14\\x15\\x16\\x17\\x18\\x19\\x1a\\e\\x1c\\x1d\\x1e\\x1f !\"#$%&\\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\\x7f'")
})

test(escDash.name, () => {
    expect(escDash`cmd ${'abc'}`).toBe(`cmd abc`)
    expect(escDash`cmd ${''}`).toBe(`cmd ''`)
    expect(escDash`cmd ${Math.PI}`).toBe(`cmd 3.141592653589793`)
    expect(escDash`cmd ${['foo','bar']}`).toBe(`cmd foo bar`)
    expect(escDash`cmd ${'foo bar'}`).toBe(`cmd foo\\ bar`)
    expect(escDash`cmd ${ASCII_CHARS}`).toBe("cmd \"\\00\\01\\02\\03\\04\\05\\06\\a\\b\\t\\n\\v\\f\\r\\016\\017\\020\\021\\022\\023\\024\\025\\026\\027\\030\\031\\032\\033\\034\\035\\036\\037\"\\ \"\\041\\042\\043\\044\"%\"\\046\\047\\050\\051\\052\"+\"\\054\"-./0123456789:\"\\073\\074\\075\\076\\077\"@ABCDEFGHIJKLMNOPQRSTUVWXYZ\"\\0133\\0134\\0135\\0136\"_\"\\0140\"abcdefghijklmnopqrstuvwxyz\"\\0173\\0174\\0175\\0176\\0177\"")
})
