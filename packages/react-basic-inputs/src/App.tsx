import {ColorInput} from './components/ColorInput'
import {DateInput} from './components/DateInput'
import {DatetimeLocalInput} from './components/DatetimeLocalInput'
import {DecimalInput} from './components/DecimalInput'
import {EmailInput} from './components/EmailInput'
import {Input} from './components/Input'
import {MonthInput} from './components/MonthInput'
import {NumberInput} from './components/NumberInput'
import {NumericInput} from './components/NumericInput'
import {PasswordInput} from './components/PasswordInput'
import {PhoneInput} from './components/PhoneInput'
import {RadioMenu} from './components/RadioMenu'
import {FC, ReactNode, useState} from 'react'
import {SearchInput} from './components/SearchInput'
import {Select, SelectOption} from './components/Select'
import {TextArea} from './components/TextArea'
import {TextInput} from './components/TextInput'
import {TimeInput} from './components/TimeInput'
import {UrlInput} from './components/UrlInput'
import {UsernameInput} from './components/UsernameInput'
import {WeekInput} from './components/WeekInput'
import css from './App.module.css'
import {BasicSelect} from './components/BasicSelect.tsx'
import {DebouncedInput} from './components/DebouncedInput.tsx'
import {ActionButton} from './components/ActionButton.tsx'
import {logJson} from './util/debug.ts'
import {jsonStringify} from './util/json-serialize.ts'
import {BasicOption} from './components/BasicOption.tsx'


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
            <Select options={FRUIT_OPTIONS} />
        </>
    )
}

function Select_Example4() {
    return (
        <>
            <h3>Placeholder</h3>
            <Select options={FRUIT_OPTIONS} placeholder="-- Please Select --" />
        </>
    )
}

const FlexRow: FC<{ children: ReactNode }> = ({children}) => <div className={css.flexRow}>{children}</div>

function Select_Example1() {
    const [value, setValue] = useState(8)
    return (
        <>
            <h3>Basic</h3>
            <div className={css.flexRow}>
                <Select options={FRUIT_OPTIONS} value={value} onChange={ev => setValue(ev.value)} />
                <output>{JSON.stringify(value)}</output>
            </div>
        </>
    )
}

function Select_Dupe() {
    const [value, setValue] = useState(1)
    return (
        <>
            <h3>Basic</h3>
            <div className={css.flexRow}>
                <Select options={DUPLICATE_OPTIONS} value={value} onChange={ev => setValue(ev.value)} />
                <output>{JSON.stringify(value)}</output>
            </div>
            <button type="button" onClick={() => setValue(1)}>Set Banana</button>
        </>
    )
}

function Select_Example2() {
    const [value, setValue] = useState(15)
    return (
        <>
            <h3>Invalid Option & External Setter</h3>
            <div className={css.flexRow}>
                <Select placeholder="-- Not Selected --" options={FRUIT_OPTIONS} value={value}
                    onChange={ev => setValue(ev.value)} />
                <output>{JSON.stringify(value)}</output>
            </div>
            <div className={css.flexRow}>
                <button type="button" onClick={() => setValue(null as any)}>Set Null</button>
                <button type="button" onClick={() => setValue(2)}>Set Cherry</button>
                <button type="button" onClick={() => setValue(FRUIT_OPTIONS.length + 1)}>Set Invalid</button>
                <button type="button" onClick={() => setValue(Math.floor(Math.random() * 20))}>Set Random</button>
                <button type="button" onClick={() => setValue(v => v + 1)}>Next</button>
            </div>

        </>
    )
}

function SelectFieldset() {
    return (
        <fieldset>
            <legend><code>&lt;Select&gt;</code></legend>
            <Select_Example3 />
            <Select_Example1 />
            <Select_Example2 />
            <Select_Example4 />
            <Select_Dupe />
        </fieldset>
    )
}

function BasicSelectFieldset() {
    const [value, setValue] = useState<any>("3")
    return (
        <FieldSet legend="<BasicSelect>">
            <h3>Uncontrolled Input</h3>
            <BasicSelect>
                <option value="1">option 1</option>
                {/*<hr /> https://github.com/facebook/react/issues/27572 */}
                <option value="2">option 2</option>
                <optgroup label="more options">
                    <option value="3">option 3</option>
                    <option value="4">option 4</option>
                </optgroup>
                <optgroup label="more options">
                    <BasicOption value={5}>option 5</BasicOption>
                    <BasicOption value={5}>option 5b</BasicOption>
                    <BasicOption value={"5(2)"}>option 5(2)</BasicOption>
                    <BasicOption value={[6, 7]}>option 6,7</BasicOption>
                    <BasicOption value={{eight: 9n}}>option 9n</BasicOption>
                </optgroup>
            </BasicSelect>
            <h3>Controlled Input</h3>
            <FlexRow>
                <BasicSelect value={value} onChange={ev => setValue(ev.value)}>
                    <option value="1">option 1</option>
                    {/*<hr /> https://github.com/facebook/react/issues/27572 */}
                    <option value="2">option 2</option>
                    <optgroup label="more options">
                        <option value="3">option 3</option>
                        <option value="4">option 4</option>
                    </optgroup>
                    <optgroup label="more options">
                        <BasicOption value={5}>option 5</BasicOption>
                        <BasicOption value={5}>option 5b</BasicOption>
                        <BasicOption value={5}>option 5c</BasicOption>
                        <BasicOption value={"5(2)"}>option 5(2)</BasicOption>
                        <BasicOption value={[6, 7]}>option 6,7</BasicOption>
                        <BasicOption value={{eight: 9n}}>option 9n</BasicOption>
                    </optgroup>
                </BasicSelect>
                <output>{jsonStringify(value)}</output>
            </FlexRow>
            <ActionButton onClick={() => setValue(5)}>Set 5</ActionButton>
        </FieldSet>
    )
}


function TextInput_Example1() {
    return (
        <>
        <h3>Uncontrolled Input</h3>
            <TextInput />
        </>
    )
}


function TextInput_Example2() {
    const [value, setValue] = useState("\tHello  \"\n\r\x0B\x0C\xA0\" world ")
    return (
        <>
            <h3>Collapse Spaces</h3>
            <div className={css.flexRow}>
                <TextInput value={value} onChange={ev => setValue(ev.value)} />
                <output>{JSON.stringify(value)}</output>
            </div>
            <button type="button" onClick={() => setValue('\t"     "\t')}>Set Space</button>
        </>
    )
}

function TextInputFieldset() {
    return (
        <FieldSet legend={<code>&lt;TextInput&gt;</code>}>
            <TextInput_Example1 />
            <TextInput_Example2 />
        </FieldSet>
    )
}

function InputFieldset() {
    const [value, setValue] = useState("Hello")
    return (
        <FieldSet legend={<code>&lt;Input&gt;</code>}>
            <div className={css.flexRow}>
                <Input />
            </div>
            <div className={css.flexRow}>
                <Input value={value} onChange={e => setValue(e.value)} />
                <output>{JSON.stringify(value)}</output>
            </div>
        </FieldSet>
    )
}

function DebouncedFieldset() {
    const [value, setValue] = useState("Hello")
    return (
        <FieldSet legend={<code>&lt;DebouncedInput&gt;</code>}>
            <div className={css.flexRow}>
                <DebouncedInput value={value} onChange={e => setValue(e.value)} debounce={1000} />
                <output>{JSON.stringify(value)}</output>
            </div>
            <div>
                <ActionButton onClick={() => {
                    console.log('click')
                    setValue("Goodbye")
                }}>Reset</ActionButton>
            </div>
        </FieldSet>
    )
}


type FieldSetProps = {
    legend: ReactNode
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
            <EmailInput placeholder="Email" />
            <NumberInput placeholder={123} />
            <DecimalInput placeholder="456" />
            <NumericInput placeholder="3.14" />
            <PhoneInput placeholder="867-5309" />
            <SearchInput placeholder="Google" />
            <UrlInput placeholder="example.org" />
        </FieldSet>
    )
}

function ColorFieldset() {
    const [value, setValue] = useState("#FF0000")
    // TODO: choose font color using color-contrast: https://caniuse.com/mdn-css_types_color_color-contrast
    return (
        <fieldset>
            <legend>Color</legend>
            <ColorInput value={value} onChange={ev => setValue(ev.value)} />
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
        <FieldSet legend="Date Inputs">
            <DateInput />
            <MonthInput />
            <WeekInput />
            <TimeInput />
            <DatetimeLocalInput />
        </FieldSet>
    )
}

function UserPassFields() {
    return (
        <FieldSet legend="Username & Password">
            <UsernameInput />
            <PasswordInput autoComplete="new-password" />
        </FieldSet>
    )
}

function TextAreaFields() {
    return (
        <FieldSet legend={<code>&lt;TextArea&gt;</code>}>
            <TextArea />
            <TextArea initialHeight="0" />
            <TextArea rows={3} />
        </FieldSet>
    )
}

function RadioMenuFields() {
    return (
        <FieldSet legend={<code>&lt;RadioMenu&gt;</code>}>
            <RadioMenu options={[
                {text: "Opt1", value: 1},
                {text: "Opt2", value: 2},
                {text: "Opt3", value: 3},
            ]} />
        </FieldSet>
    )
}

// TODO: password + file
export default function App() {
    return (
        <form className={css.grid}>
            <SelectFieldset />
            <BasicSelectFieldset />
            <InputFieldset />
            <DebouncedFieldset />
            <TextInputFieldset />
            <OtherTextInputsFieldset />
            <ColorFieldset />
            <DateFieldset />
            <UserPassFields />
            <TextAreaFields />
            <RadioMenuFields />
        </form>
    )
}
