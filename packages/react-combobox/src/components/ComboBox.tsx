
import * as React from 'react';
import Downshift, {ControllerStateAndHelpers, GetItemPropsOptions} from 'downshift'
import styled, {keyframes, css} from 'react-emotion';
import EndOfBody from './EndOfBody';
import SearchIcon from './SearchIcon';
import {ReactNode} from 'react';
import Apple from './icons/apple';
import Banana from './icons/banana';
import Grapes from './icons/grapes';
import Orange from './icons/orange';
import Pear from './icons/pear';
import charMap from '../charMap';

const Container = styled.button`
     border: 1px solid #b8b8b8;
     display: inline-flex;
     cursor: pointer;
     padding: 2px 4px;
     align-items: center;
     font-family: "Roboto", "Helvetica", "Arial", sans-serif;
     background-color: #f8f8f8;
`;

interface ArrowProps {
    isOpen: boolean
}

const Arrow = styled.span<ArrowProps>`
    width: 0;
    height: 0;
    border-style: solid;
    margin-left: 5px;

    ${({isOpen}) => isOpen ? css`
        border-width: 0 4px 6px 4px;
        border-color: transparent transparent #808080 transparent;
    ` : css`
        border-width: 6px 4px 0 4px;
        border-color: #808080 transparent transparent transparent;
    `};
`

const spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`


interface Item<T = number> {
    value: T
    option: ReactNode
    label?: ReactNode
    search?: number[]
}


const Fruit = styled.span`
    display: inline-block;
    //text-align: right;
    height: 1em;
    width: 1em;
    overflow: visible;
    margin-right: 4px;
`

function stringToWeights(str: string): number[] {
    return Array.prototype.concat(...Array.from(str).map(ch => charMap[ch] || [-ch.codePointAt(0)!]));
}

const items: Item[] = [
    {search: stringToWeights('apple'), option: <><Fruit><Apple/></Fruit> Apple</>, value: 1, label: "Apple"},
    {search: stringToWeights('pear'), option: <><Fruit><Pear/></Fruit> Pear</>, value: 2, label: "Pear"},
    {search: stringToWeights('orange'), option: <><Fruit><Orange/></Fruit> Orange</>, value: 3, label: "Orange"},
    {search: stringToWeights('grape'), option: <><Fruit><Grapes/></Fruit> Grape</>, value: 4, label: "Grape"},
    {search: stringToWeights('banana'), option: <><Fruit><Banana/></Fruit> Banana</>, value: 5, label: "Banana"},
]

function contains(haystack: number[], needle: number[]): boolean {
    let index = 0;
    return needle.every(a => {
        const i = haystack.indexOf(a, index);
        if(i !== -1) {
            index = i+1;
            return true;
        }
        return false;
    })
}

interface ListItemProps extends GetItemPropsOptions<Item> {
    highlighted: boolean
    selected: boolean
}

// const ListItem = styled.li`
//     background-color: ${({highlightedIndex,index}: ListItemProps) => highlightedIndex === index ? 'lightgray' : 'white'};
//     font-weight: ${({selectedItem,item}: ListItemProps) => selectedItem === item ? 'bold' : 'normal'};
// `

const ListItem = styled.li<ListItemProps>`
    font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    padding: 2px 4px;
    cursor: pointer;
    display: flex;
    align-items: end;
    ${({highlighted}) => highlighted && css`
        background-color: rgba(0, 0, 0, 0.08);
    `}
    ${({selected}) => selected && css`
        background-color: rgba(0, 0, 0, 0.14);
    `}
`

interface ComboBoxProps extends ControllerStateAndHelpers<Item> {
}

interface ComboBoxState {
}

interface ComboBoxSnapshot {
    x: number
    y: number
    width: number
}


function getDocumentCoordinates(elem: Element) {
    // http://javascript.info/coordinates#getCoords
    const box = elem.getBoundingClientRect();
    
    return {
        x: box.left + pageXOffset,
        y: box.top + pageYOffset,
    }
}

export default function ComboBox() {
    return (
        <Downshift
            // itemToString={item => item ? String(item.value) : ''}
            defaultHighlightedIndex={0}
            children={p => <span><ComboBoxInner {...p}/></span>}
        />
    )
}

const Menu = styled.div`
    position: absolute;
    background-color: white;
    border: 1px solid #b8b8b8;
    padding: 2px;
    box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.12);
    box-sizing: border-box;
    //display: inline-flex;
    //flex-direction:column;
    //flex-wrap: nowrap;
      
`

const MenuList = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
`

const SearchInput = styled.input`
    margin-bottom: 2px;
    border: 1px solid #b8b8b8;
    padding: 2px 20px 2px 4px;
    //width: 100px;
    //min-width: 100%;
    outline: none;

    box-sizing: border-box;
    width: 100%;
     background-color: #f8f8f8;
    //flex: 1;
    //&:focus {
    //    border-color: #2F92F0;
    //}
`

const SearchWrap = styled.div`
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    position: relative;
    flex: 1;
    width: 100px;
    min-width: 100%;
`

const StyledSearchIcon = styled(SearchIcon)`
    height: .9em;
    position: absolute;
    right: 4px;
    fill: #808080;
    pointer-events: none;
`


function resolve<TArgs extends any[],TRet>(fn: ((...args: TArgs) => TRet)|TRet, ...args: TArgs): TRet {
    return isFunction(fn) ? fn(...args) : fn;
}

function isString(x: any): x is string {
    return typeof x === 'string' || x instanceof String;
}

function isFunction(x: any): x is Function {
    return typeof x === 'function';
}

class ComboBoxInner extends React.Component<ComboBoxProps, ComboBoxState, ComboBoxSnapshot> {

    input = React.createRef<HTMLInputElement>();
    container = React.createRef<HTMLDivElement>();
    menu = React.createRef<HTMLDivElement>();

    getSnapshotBeforeUpdate(prevProps: ComboBoxProps, prevState: ComboBoxState): ComboBoxSnapshot | null {
        if(this.container.current) {
            const rect = this.container.current.getBoundingClientRect();
            const bbWidth = this.container.current.computedStyleMap
                ? this.container.current.computedStyleMap().get('border-bottom-width').to('px').value
                : parseFloat(getComputedStyle(this.container.current).getPropertyValue('border-bottom-width'));
            return {
                x: rect.left + pageXOffset,
                y: rect.bottom + pageYOffset - bbWidth,
                width: rect.width
            }
        }
        return null;
    }

    componentDidUpdate(prevProps: ComboBoxProps, prevState: ComboBoxState, snapshot: ComboBoxSnapshot) {
        if(this.menu.current) {
            Object.assign(this.menu.current.style, {
                left: `${snapshot.x}px`,
                top: `${snapshot.y}px`,
                minWidth: `${snapshot.width}px`
            })
        }
    }

    render() {
        const {isOpen, getInputProps, getMenuProps, inputValue, getItemProps, highlightedIndex, selectedItem, setState, closeMenu} = this.props;

        return <>
            <Container innerRef={this.container} onClick={() => {
                if(isOpen) {
                    closeMenu();
                } else {
                    setState({
                        isOpen: true,
                        inputValue: '',
                    }, () => {
                        if (this.input.current) {
                            this.input.current.focus()
                        }
                    })
                }
            }}>{selectedItem ? selectedItem.label || selectedItem.option : "Please Choose"}<Arrow isOpen={isOpen}/></Container>

            {isOpen && <EndOfBody>
                <Menu innerRef={this.menu}>
                    <SearchWrap>
                        <SearchInput {...getInputProps({placeholder: 'Filter...'})} innerRef={this.input} />
                        <StyledSearchIcon/>
                    </SearchWrap>
                    <MenuList {...getMenuProps({refKey: 'innerRef'})}>
                        {items
                        // TODO: case folding http://unicode.org/reports/tr10/   http://www.unicode.org/Public/UCA/9.0.0/allkeys.txt
                            // > In the row with the expansion for "æ", the two underlined primary weights have the same values as the primary weights for the simple mappings for "a" and "e", respectively. This is the basis for establishing a primary equivalence between "æ" and the sequence "ae".
                            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Collator
                            // https://www.unicode.org/Public/UCA/latest/
                            .filter(item => !inputValue || (item.search ? contains(item.search, stringToWeights(inputValue)) : (isString(item.option) ? item.option.includes(inputValue) : (isString(item.label) && item.label.includes(inputValue)))))
                            .map((item, index) => (
                                <ListItem
                                    {...getItemProps({
                                        key: item.value,
                                        index,
                                        item,
                                    })}
                                    highlighted={highlightedIndex === index}
                                    selected={selectedItem === item}
                                >
                                    {item.option}
                                </ListItem>
                            ))
                        }
                    </MenuList>
                </Menu>
            </EndOfBody>}
        </>
    }
}

/*
TODO:
- press enter to select item after searching
- clicking in searchbox should not close input
 */