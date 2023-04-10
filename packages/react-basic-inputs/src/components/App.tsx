import {Select, SelectOption} from './Select'
import {useState} from 'react'
import {TextInput} from './TextInput'


const FRUIT_OPTIONS: SelectOption<number>[] = [
    {text: "Apple", value: 0},
    {text: "Banana", value: 1},
    {text: "Cherry", value: 2},
    {text: "Date", value: 3},
    {text: "Grape", value: 4},
    {text: "Kiwi", value: 5},
    {text: "Mango", value: 6},
    {text: "Orange", value: 7},
    {text: "Peach", value: 8},
    {text: "Pineapple", value: 9},
    {text: "Strawberry", value: 10},
]

function Select_Example1() {
    const [value, setValue] = useState(8)
    return (
        <div>
            <Select options={FRUIT_OPTIONS} value={value} onChange={ev => setValue(ev.value)}/>
            <output>{JSON.stringify(value)}</output>
        </div>
    )
}

function Select_Example2() {
    const [value, setValue] = useState(15)
    return (
        <div>
            <Select options={FRUIT_OPTIONS} value={value} onChange={ev => setValue(ev.value)}/>
            <output>{JSON.stringify(value)}</output>
        </div>
    )
}

function SelectFieldset() {
    return (
        <fieldset>
            <legend>&lt;Select&gt;</legend>
            <Select_Example1/>
            <Select_Example2/>
        </fieldset>
    )
}

function TextInput_Example1() {
    const [value, setValue] = useState("\tHello  \"\n\r\x0B\x0C\xA0\" world ")
    return (
        <div>
            <TextInput value={value} onChange={ev => setValue(ev.value)}/>
            <output>{JSON.stringify(value)}</output>
        </div>
    )
}

function TextInputFieldset() {


    return (
        <fieldset>
            <legend>&lt;TextInput&gt;</legend>
            <TextInput_Example1/>
        </fieldset>
    )
}


export default function App() {
    return (
        <form>
            <SelectFieldset/>
            <TextInputFieldset/>
        </form>
    )
}
