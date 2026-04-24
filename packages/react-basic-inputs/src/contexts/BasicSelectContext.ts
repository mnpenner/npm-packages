import {createContext} from 'react'
import type {KeyFixer} from '../util/key-fixer.ts'

export const BasicSelectContext = createContext<{ fixer: KeyFixer, index: number } | null>(null)
