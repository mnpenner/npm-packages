import {Select, SelectOption} from './Select'
import {useState} from 'react'
import {TextInput} from './TextInput'
import {EmailInput} from './EmailInput'
import {DecimalInput} from './DecimalInput'
import {NumericInput} from './NumericInput'
import {PhoneInput} from './PhoneInput'
import {SearchInput} from './SearchInput'
import {UrlInput} from './UrlInput'
import {NumberInput} from './NumberInput'
import {ColorInput} from './ColorInput'
import {MonthInput} from './MonthInput'
import {DateInput} from './DateInput'
import {WeekInput} from './WeekInput'
import {DatetimeLocalInput} from './DatetimeLocalInput'
import {TimeInput} from './TimeInput'


const FRUIT_OPTIONS: SelectOption<number>[] = [
    {text: "Apple", value: 0},
    {text: "Banana", value: 1},
    {text: "Cherry", value: 2},
    {text: "Date", value: 3},
    {text: "Grape", value: 4},
    {text: "Kiwi", value: 5},
    {text: "Mango", value: 6},
    {text: "Orange", value: 7, style: {color: 'orange'}},
    {text: "Peach", value: 8},
    {text: "Pineapple", value: 9},
    {text: "Strawberry", value: 10},
]

const DUPLICATE_OPTIONS: SelectOption<number>[] = [
    {text: "Apple", value: 0},
    {text: "Banana", value: 1},
    {text: "Cherry", value: 2},
    {text: "Banana 2", value: 1},
    {text: "Banana 2-2", value: 1, key: '1(2)'},  // force an adversarial collision
    {text: "Banana 3", value: 1},
]

function Select_Example3() {
    return (
        <>
            <div>Uncontrolled</div>
            <Select options={FRUIT_OPTIONS}/>
        </>
    )
}

function Select_Example4() {
    return (
        <>
            <div>Placeholder</div>
            <Select options={FRUIT_OPTIONS} placeholder="-- Please Select --"/>
        </>
    )
}


function Select_Example1() {
    const [value, setValue] = useState(8)
    return (
        <>
            <div>Basic</div>
            <Select options={FRUIT_OPTIONS} value={value} onChange={ev => setValue(ev.value)}/>
            <output>{JSON.stringify(value)}</output>
        </>
    )
}

function Select_Dupe() {
    const [value, setValue] = useState(1)
    return (
        <>
            <div>Basic</div>
            <Select options={DUPLICATE_OPTIONS} value={value} onChange={ev => setValue(ev.value)}/>
            <button type="button" onClick={() => setValue(1)}>Set Banana</button>
            <output>{JSON.stringify(value)}</output>
        </>
    )
}

function Select_Example2() {
    const [value, setValue] = useState(15)
    return (
        <>
            <div>Invalid Option & External Setter</div>
            <Select placeholder="-- Not Selected --" options={FRUIT_OPTIONS} value={value}
                    onChange={ev => setValue(ev.value)}/>
            <button type="button" onClick={() => setValue(null as any)}>Set Null</button>
            <button type="button" onClick={() => setValue(2)}>Set Cherry</button>
            <button type="button" onClick={() => setValue(11)}>Set Invalid</button>
            <button type="button" onClick={() => setValue(Math.floor(Math.random() * 20))}>Set Random</button>
            <button type="button" onClick={() => setValue(v => v + 1)}>Next</button>
            <output>{JSON.stringify(value)}</output>
        </>
    )
}

function SelectFieldset() {
    return (
        <fieldset>
            <legend>&lt;Select&gt;</legend>
            <Select_Example3/>
            <Select_Example1/>
            <Select_Example2/>
            <Select_Example4/>
            <Select_Dupe/>
        </fieldset>
    )
}

function TextInput_Example1() {
    return (
        <>
            <div>Uncontrolled Input</div>
            <TextInput/>
        </>
    )
}


function TextInput_Example2() {
    const [value, setValue] = useState("\tHello  \"\n\r\x0B\x0C\xA0\" world ")
    return (
        <>
            <div>Collapse Spaces</div>
            <TextInput value={value} onChange={ev => setValue(ev.value)}/>
            <button type="button" onClick={() => setValue('\t"     "\t')}>Set Space</button>
            <output>{JSON.stringify(value)}</output>
        </>
    )
}

function TextInputFieldset() {
    return (
        <fieldset>
            <legend>&lt;TextInput&gt;</legend>
            <TextInput_Example1/>
            <TextInput_Example2/>
        </fieldset>
    )
}

function OtherTextInputsFieldset() {
    return (
        <fieldset>
            <legend>Other Text Inputs</legend>
            <EmailInput placeholder="Email"/>
            <NumberInput placeholder={123}/>
            <DecimalInput placeholder="456"/>
            <NumericInput placeholder="3.14"/>
            <PhoneInput placeholder="867-5309"/>
            <SearchInput placeholder="Google"/>
            <UrlInput placeholder="example.org"/>
        </fieldset>
    )
}

function ColorFieldset() {
    const [value, setValue] = useState("#FF0000")
    // TODO: choose font color using color-contrast: https://caniuse.com/mdn-css_types_color_color-contrast
    return (
        <fieldset>
            <legend>Color</legend>
            <ColorInput value={value} onChange={ev => setValue(ev.target.value)}/>
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: value
            }}>{JSON.stringify(value)}</div>
        </fieldset>
    )
}

function DateFieldset() {
    return (
        <fieldset>
            <legend>Date Inputs</legend>
            <DateInput/>
            <MonthInput/>
            <WeekInput/>
            <TimeInput/>
            <DatetimeLocalInput/>
        </fieldset>
    )
}

// TODO: password + file
export default function App() {
    return (
        <form>
            <SelectFieldset/>
            <TextInputFieldset/>
            <OtherTextInputsFieldset/>
            <ColorFieldset/>
            <DateFieldset/>
        </form>
    )
}
