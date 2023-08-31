import {Select, SelectOption} from './Select'
import {ReactNode, useState} from 'react'
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
    {text: "Elderberry", value: 4},
    {text: "Fig", value: 5},
    {text: "Grape", value: 6},
    {text: "Honeydew", value: 7},
    {text: "Kiwi", value: 8},
    {text: "Lemon", value: 9},
    {text: "Mango", value: 10},
    {text: "Nectarine", value: 11},
    {text: "Orange", value: 12, style: {color: 'orange'}},
    {text: "Peach", value: 13},
    {text: "Pineapple", value: 14},
    {text: "Quince", value: 15},
    {text: "Raspberry", value: 16},
    {text: "Strawberry", value: 17},
    {text: "Tangerine", value: 18},
    {text: "Ugli fruit", value: 19},
    {text: "Vanilla bean", value: 20},
    {text: "Watermelon", value: 21},
    {text: "Xigua", value: 22},
    {text: "Yellow passion fruit", value: 23},
    {text: "Zucchini", value: 24}
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
            <h3>Uncontrolled</h3>
            <Select options={FRUIT_OPTIONS}/>
        </>
    )
}

function Select_Example4() {
    return (
        <>
            <h3>Placeholder</h3>
            <Select options={FRUIT_OPTIONS} placeholder="-- Please Select --"/>
        </>
    )
}


function Select_Example1() {
    const [value, setValue] = useState(8)
    return (
        <>
            <h3>Basic</h3>
            <Select options={FRUIT_OPTIONS} value={value} onChange={ev => setValue(ev.value)}/>
            <output>{JSON.stringify(value)}</output>
        </>
    )
}

function Select_Dupe() {
    const [value, setValue] = useState(1)
    return (
        <>
            <h3>Basic</h3>
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
            <h3>Invalid Option & External Setter</h3>
            <Select placeholder="-- Not Selected --" options={FRUIT_OPTIONS} value={value}
                    onChange={ev => setValue(ev.value)}/>
            <div>
                <button type="button" onClick={() => setValue(null as any)}>Set Null</button>
                <button type="button" onClick={() => setValue(2)}>Set Cherry</button>
                <button type="button" onClick={() => setValue(11)}>Set Invalid</button>
                <button type="button" onClick={() => setValue(Math.floor(Math.random() * 20))}>Set Random</button>
                <button type="button" onClick={() => setValue(v => v + 1)}>Next</button>
            </div>
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
            <h3>Uncontrolled Input</h3>
            <TextInput/>
        </>
    )
}


function TextInput_Example2() {
    const [value, setValue] = useState("\tHello  \"\n\r\x0B\x0C\xA0\" world ")
    return (
        <>
            <h3>Collapse Spaces</h3>
            <TextInput value={value} onChange={ev => setValue(ev.value)}/>
            <button type="button" onClick={() => setValue('\t"     "\t')}>Set Space</button>
            <output>{JSON.stringify(value)}</output>
        </>
    )
}

function TextInputFieldset() {
    return (
        <FieldSet legend="<TextInput>">
            <TextInput_Example1/>
            <TextInput_Example2/>
        </FieldSet>
    )
}


type FieldSetProps = {
    legend: string
    children: ReactNode
}

function FieldSet({legend, children}: FieldSetProps) {
    return (
        <fieldset>
            <legend>{legend}</legend>
            <div>{children}</div>
        </fieldset>
    )
}

function OtherTextInputsFieldset() {
    return (
        <FieldSet legend="Other Text Inputs">
            <EmailInput placeholder="Email"/>
            <NumberInput placeholder={123}/>
            <DecimalInput placeholder="456"/>
            <NumericInput placeholder="3.14"/>
            <PhoneInput placeholder="867-5309"/>
            <SearchInput placeholder="Google"/>
            <UrlInput placeholder="example.org"/>
        </FieldSet>
    )
}

function ColorFieldset() {
    const [value, setValue] = useState("#FF0000")
    // TODO: choose font color using color-contrast: https://caniuse.com/mdn-css_types_color_color-contrast
    return (
        <fieldset>
            <legend>Color</legend>
            <ColorInput value={value} onChange={ev => setValue(ev.value)}/>
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
