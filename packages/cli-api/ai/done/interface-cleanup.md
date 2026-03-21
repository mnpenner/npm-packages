Can some of these interfaces like `ArgumentOrOptionOrFlag` be cleaned up? Looks like we're always omitting 'name' and 'key' with

type FlagConfigInput = Omit<Flag, 'name' | 'key' | 'valueNotRequired'> & { key?: string }
type OptionConfigInput = Omit<Option, 'name' | 'key'> & { key?: string }
type ArgumentConfigInput = Omit<Argument, 'name' | 'key'> & { key?: string }


Why is 'key' omitted? Key is supposed to be the 'key' used in the App.run kwargs. It looks like ArgumentOrOptionOrFlag.key is misdocumented too (it's called run() now, not execute() -- execute is for executing the app)
