import * as classNames from 'classnames';

export interface ClassArray extends Array<ClassValue> { }

export type ClassValue = string | number | ClassDictionary | ClassArray | undefined | null | false;

export interface ClassDictionary {
    [id: string]: boolean | undefined | null;
}


// export interface IDict<TValue> {
//     [key: string]: TValue // TS1023 prevents us from allowing arbitrary keys (symbols)
// }

export interface IAttrs {
    className?: ClassValue,
    style?: {[prop: string]: string|number},
    ref?: RefCallback,
    // TODO: fill with exhaustive list of attributes to assist the IDE
    [other: string]: any;
}

// @types/react is borked -- copy SyntheticEvent here to avoid compile errors
interface SyntheticEvent<T> {
    bubbles: boolean;
    currentTarget: EventTarget & T;
    cancelable: boolean;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    nativeEvent: Event;
    preventDefault(): void;
    isDefaultPrevented(): boolean;
    stopPropagation(): void;
    isPropagationStopped(): boolean;
    persist(): void;
    // If you thought this should be `EventTarget & T`, see https://github.com/DefinitelyTyped/DefinitelyTyped/pull/12239
    target: EventTarget;
    timeStamp: number;
    type: string;
}


type EventHandler = (e: SyntheticEvent<any>) => void;
export type RefCallback = (n: Element) => void;

export default function mergeAttrs(merged: IAttrs, ...attrDicts: IAttrs[]): IAttrs {
    let eventHandlers: {[attr:string]: Array<EventHandler|RefCallback>} = {};
    let classes = merged.className ? [merged.className] : [];

    for(let attrs of attrDicts) {
        for(let attr of Object.keys(attrs)) {
            const value = attrs[attr];
            

            if(value === undefined) {
                //
            } else if(merged[attr] === undefined) {
                merged[attr] = value;
            } else if(attr === 'style') {
                Object.assign(merged[attr], value);
            } else if(attr === 'className') {
                classes.push(value);
            } else if(attr === 'ref' || /^on[A-Z]/.test(attr)) {
                (eventHandlers[attr] || (eventHandlers[attr] = [])).push(value);
            } else {
                merged[attr] = value;
            }
        }
    }

    if(classes.length) {
        merged.className = classNames(...classes);
    }

    for(let attr of Object.keys(eventHandlers)) {
        const funcs = eventHandlers[attr];

        if(merged[attr]) {
            funcs.unshift(merged[attr]);
        }
        if(funcs.length === 1) {
            merged[attr] = funcs[0];
        } else {
            merged[attr] = (...args: any[]) => {
                let result = undefined;
                for(let func of funcs) {
                    let params: any[] = result === undefined ? args : [...args, result];
                    result = (func as Function)(...params);
                }
                return result;
            };
        }
    }

    return merged;
}