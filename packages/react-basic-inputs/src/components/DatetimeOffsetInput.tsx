import {HtmlSelectElement, nil, OmitProps, OverrideProps} from "../types/utility"
import {assumeProps} from '../util/assert.ts'
import {
    DateValue,
    isInvalidDateInput,
    IsoDateOptions,
    minutesToOffset,
    toDateInputValue,
    toIsoDateString
} from '../util/time.ts'
import {Select, SelectChangeEvent, SelectOption} from './Select.tsx'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {usePropChange} from '../hooks/usePropChange.ts'
import {useLatest} from '../hooks/useLatest.ts'
import {sameValueZero} from '../util/compare.ts'

export type DatetimeOffsetInputChangeEvent = {
    value: string
}


export type DatetimeOffsetInputProps = {
    min?: DateValue
    max?: DateValue
    value?: DateValue | null
    defaultValue?: DateValue
    onChange?: (ev: DatetimeOffsetInputChangeEvent) => void
    // includeSeconds?: boolean
    // includeMilliseconds?: boolean
}


const DATETIME_OFFSETS: SelectOption<number>[] = [
    // United States Minor Outlying Islands
    {value: -12 * 60, text: "-12:00"},
    // New Zealand, United States
    {value: -11 * 60, text: "-11:00"},
    // United States, French Polynesia, New Zealand
    {value: -10 * 60, text: "-10:00"},
    // France (Marquesas Islands)
    {value: -9.5 * 60, text: "-09:30"},
    // United States, Canada, Mexico
    {value: -9 * 60, text: "-09:00"},
    // United States, Canada, Mexico, UK (Pitcairn Islands)
    {value: -8 * 60, text: "-08:00"},
    // United States, Canada, Mexico
    {value: -7 * 60, text: "-07:00"},
    // United States, Canada, Mexico, Central America
    {value: -6 * 60, text: "-06:00"},
    // United States, Canada, Cuba, South America
    {value: -5 * 60, text: "-05:00"},
    // Canada, Caribbean, South America
    {value: -4 * 60, text: "-04:00"},
    // Canada (Newfoundland)
    {value: -3.5 * 60, text: "-03:30"},
    // Argentina, Brazil, Chile
    {value: -3 * 60, text: "-03:00"},
    // Brazil (Fernando de Noronha), South Georgia
    {value: -2 * 60, text: "-02:00"},
    // Cape Verde
    {value: -1 * 60, text: "-01:00"},
    // UK, Portugal, Iceland
    {value: 0, text: "±00:00"},
    // Central Europe
    {value: 1 * 60, text: "+01:00"},
    // Eastern Europe, Egypt
    {value: 2 * 60, text: "+02:00"},
    // East Africa, Middle East
    {value: 3 * 60, text: "+03:00"},
    // Iran
    {value: 3.5 * 60, text: "+03:30"},
    // UAE, Russia (Moscow)
    {value: 4 * 60, text: "+04:00"},
    // Afghanistan
    {value: 4.5 * 60, text: "+04:30"},
    // Pakistan
    {value: 5 * 60, text: "+05:00"},
    // India, Sri Lanka
    {value: 5.5 * 60, text: "+05:30"},
    // Nepal
    {value: 5.75 * 60, text: "+05:45"},
    // Bangladesh, Bhutan
    {value: 6 * 60, text: "+06:00"},
    // Myanmar
    {value: 6.5 * 60, text: "+06:30"},
    // Thailand, Vietnam
    {value: 7 * 60, text: "+07:00"},
    // China, Singapore
    {value: 8 * 60, text: "+08:00"},
    // Australia (Western)
    {value: 8.75 * 60, text: "+08:45"},
    // Japan, South Korea
    {value: 9 * 60, text: "+09:00"},
    // Australia (Central)
    {value: 9.5 * 60, text: "+09:30"},
    // Australia (Eastern)
    {value: 10 * 60, text: "+10:00"},
    // Australia (Lord Howe Island)
    {value: 10.5 * 60, text: "+10:30"},
    // Solomon Islands, Vanuatu
    {value: 11 * 60, text: "+11:00"},
    // Fiji, New Zealand
    {value: 12 * 60, text: "+12:00"},
    // New Zealand (Chatham Islands)
    {value: 12.75 * 60, text: "+12:45"},
    // Tonga, Samoa
    {value: 13 * 60, text: "+13:00"},
    // Kiribati
    {value: 14 * 60, text: "+14:00"},
]

export function extractOffset(date: DateValue | nil): number | null {
    if(typeof date !== 'string' || date === '') return null

    // Match the offset part of the ISO string and capture the sign, hours, and minutes
    const match = date.match(/([+-])(\d{2}):(\d{2})|Z$/)
    if(!match) return null

    // If the match is "Z", the offset is 0
    if(match[0] === 'Z') return 0

    // Destructure the match to get sign, hours, and minutes
    const [, sign, hours, minutes] = match

    // Calculate the offset in minutes, applying the correct sign
    const offsetInMinutes = Number(hours) * 60 + Number(minutes)
    return sign === '+' ? offsetInMinutes : -offsetInMinutes
}

export function localDateToOffset(date: string): number | null {
    if(date === '') return null
    return -new Date(date).getTimezoneOffset()
}

// function computeDateValue(v: DateValue|nil): string {
//     if(isInvalidDateInput(v)) return ''
//     return new Date(v).toISOString().slice(0, -1)
// }


export function DatetimeOffsetInput({
    value,
    defaultValue,
    min,
    max,
    onChange,
    ...props
}: DatetimeOffsetInputProps) {
    assumeProps<'input'>(props)
    const [offsetEnabled, setOffsetEnabled] = useState<boolean>(() => extractOffset(value ?? defaultValue) !== null)
    const [offset, setOffset] = useState<number | null>(() => extractOffset(value ?? defaultValue))
    const [dateValue, setDateValue] = useState<string>(() => toDateInputValue(value ?? defaultValue))

    const refValue = useRef(value)

    useEffect(() => {
        if(!sameValueZero(refValue.current, value)) {
            refValue.current = value
            setOffsetEnabled(extractOffset(value) !== null)
            setOffset(extractOffset(value))
            setDateValue(toDateInputValue(value))
        }
    }, [value])

    const triggerChange = useCallback((newValue: string) => {
        refValue.current = newValue
        if(onChange != null) {
            onChange({
                value: newValue,
            })
        }
    }, [onChange])


    if(min != null) props.min = toDateInputValue(min)
    if(max != null) props.max = toDateInputValue(max)

    const computedOffset = offsetEnabled
        ? offset
        : localDateToOffset(dateValue)

    const handleDateChange = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = ev.currentTarget.value
            setDateValue(newValue)
            const updatedOffset = offsetEnabled
                ? offset
                : isInvalidDateInput(newValue)
                    ? null
                    : -new Date(newValue).getTimezoneOffset()
            triggerChange(newValue + minutesToOffset(updatedOffset))
        },
        [offsetEnabled, offset, triggerChange]
    )

    const handleOffsetChange = useCallback(
        (ev: SelectChangeEvent<number>) => {
            setOffset(ev.value)
            triggerChange(dateValue + minutesToOffset(ev.value))
        },
        [triggerChange, dateValue]
    )

    const handleCheckboxChange = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const isChecked = ev.currentTarget.checked
            setOffsetEnabled(isChecked)
            const computedOffset = isChecked
                ? offset
                : localDateToOffset(dateValue)
            triggerChange(dateValue + minutesToOffset(computedOffset))
        },
        [offset, dateValue, triggerChange]
    )


    return (
        <span>
            <input
                type="datetime-local"
                {...props}
                value={dateValue}
                onChange={handleDateChange}
            />
            <input
                type="checkbox"
                checked={offsetEnabled}
                onChange={handleCheckboxChange}
            />
            <Select<number>
                value={computedOffset}
                onChange={handleOffsetChange}
                disabled={!offsetEnabled}
                options={DATETIME_OFFSETS}
            />
        </span>
    )
}

