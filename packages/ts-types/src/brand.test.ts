import { makeBrand, type Branded } from './brand.ts'

type PortNumber = Branded<number, 'port'>

const PortNumber = makeBrand<PortNumber>()

const port = PortNumber(3000)

// @ts-expect-error Should reject incorrect type
const badPort = PortNumber('not a number')

///

const UserId = makeBrand<number, 'UserId'>()

const userId = UserId(123)

// @ts-expect-error Should reject incorrect type
const badUser = UserId('bad')
