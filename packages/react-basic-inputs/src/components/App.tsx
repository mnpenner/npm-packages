import {Select, SelectOption} from './Select'
import {useState} from 'react'


const FRUIT_OPTIONS: SelectOption<string>[] = [
    {text: "Apple", value: "apple"},
    {text: "Banana", value: "banana"},
    {text: "Cherry", value: "cherry"},
    {text: "Date", value: "date"},
    {text: "Grape", value: "grape"},
    {text: "Kiwi", value: "kiwi"},
    {text: "Mango", value: "mango"},
    {text: "Orange", value: "orange"},
    {text: "Peach", value: "peach"},
    {text: "Pineapple", value: "pineapple"},
    {text: "Strawberry", value: "strawberry"},
]

function SelectDemo() {

    const [value, setValue] = useState("peach")

    return (
        <fieldset>
            <legend>Select</legend>
            <div>
                <Select options={FRUIT_OPTIONS} value={value} onChange={ev => setValue(ev.value)}/>
                <output>{value}</output>
            </div>
        </fieldset>
    )
}

export default function App() {
    return (
        <form>
            <SelectDemo/>
        </form>
    )
}
