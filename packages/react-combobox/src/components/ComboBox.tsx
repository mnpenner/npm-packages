
import * as React from 'react';
import Downshift, {ControllerStateAndHelpers, GetItemPropsOptions} from 'downshift'
import styled, {keyframes, css} from 'react-emotion';
import EndOfBody from './EndOfBody';
import SearchIcon from './SearchIcon';

const Container = styled.div`
     border: 1px solid #b8b8b8;
     display: inline-flex;
     cursor: pointer;
     padding: 2px 4px;
     align-items: center;
     font-family: "Roboto", "Helvetica", "Arial", sans-serif;
`;

interface ArrowProps {
    isOpen: boolean
}

const Arrow = styled.span<ArrowProps>`
    width: 0;
    height: 0;
    border-style: solid;
    margin-left: 4px;

    ${({isOpen}) => isOpen ? css`
        border-width: 0 5px 6px 5px;
        border-color: transparent transparent #808080 transparent;
    ` : css`
        border-width: 6px 5px 0 5px;
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
    label: string
    search?: string
}

const items: Item[] = [
    {search: 'apple', label: 'Apple', value: 1},
    {search: 'pear', label: 'Pear', value: 2},
    {search: 'orange', label: 'Orange', value: 3},
    {search: 'grape', label: 'Grape', value: 4},
    {search: 'banana', label: 'Banana', value: 5},
]

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
            itemToString={item => (item ? item.label : '')}
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
            }}>{selectedItem ? selectedItem.label : "Please Choose"}<Arrow isOpen={isOpen}/></Container>

            {isOpen && <EndOfBody>
                <Menu innerRef={this.menu}>
                    <SearchWrap>
                        <SearchInput {...getInputProps({placeholder: 'Filter...'})} innerRef={this.input} />
                        <StyledSearchIcon/>
                    </SearchWrap>
                    <MenuList {...getMenuProps({refKey: 'innerRef'})}>
                        {items
                            .filter(item => !inputValue || (item.search || item.label).includes(inputValue))
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
                                    {item.label}
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