import { stringWidth as stringWidthImpl } from "bun";


export function stringWidth(str: string): number {
    return stringWidthImpl(str)
}
