
import * as React from 'react';
import Downshift, {ControllerStateAndHelpers, GetItemPropsOptions} from 'downshift'
import styled, {keyframes, css} from 'react-emotion';
import EndOfBody from './EndOfBody';

const Container = styled.div`
     border: 1px solid #b8b8b8;
     display: inline-flex;
     cursor: pointer;
     padding: 2px 3px;
     align-items: center;
`;

interface ArrowProps {
    isOpen: boolean
}

const Arrow = styled.span<ArrowProps>`
    width: 0;
    height: 0;
    border-style: solid;
    margin-left: 3px;

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

type ListItemProps = GetItemPropsOptions<Item>

// const ListItem = styled.li`
//     background-color: ${({highlightedIndex,index}: ListItemProps) => highlightedIndex === index ? 'lightgray' : 'white'};
//     font-weight: ${({selectedItem,item}: ListItemProps) => selectedItem === item ? 'bold' : 'normal'};
// `

const ListItem = styled.li<ListItemProps>``

interface ComboBoxProps extends ControllerStateAndHelpers<Item> {
}

interface ComboBoxState {
}

interface ComboBoxSnapshot {
    x: number
    y: number
}


function getDocumentCoordinates(elem: Element) {
    // http://javascript.info/coordinates#getCoords
    const box = elem.getBoundingClientRect();
    
    return {
        x: box.left + pageXOffset,
        y: box.top + pageYOffset,
    }
}

export default () => <Downshift itemToString={item => (item ? item.label : '')}>{p => <div><ComboBoxInner {...p}/></div>}</Downshift>

const Menu = styled.div`
    position: absolute;
    background-color: white;
    border: 1px solid #b8b8b8;
    padding: 2px;
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
                y: rect.bottom + pageYOffset - bbWidth
            }
        }
        return null;
    }

    componentDidUpdate(prevProps: ComboBoxProps, prevState: ComboBoxState, snapshot: ComboBoxSnapshot) {
        if(this.menu.current) {
            Object.assign(this.menu.current.style, {
                left: `${snapshot.x}px`,
                top: `${snapshot.y}px`
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
                    <input {...getInputProps({autoFocus: true, ref: this.input})}/>
                    <ul {...getMenuProps()}>
                        {isOpen
                            ? items
                                .filter(item => !inputValue || (item.search || item.label).includes(inputValue))
                                .map((item, index) => (
                                    <ListItem
                                        {...getItemProps({
                                            key: item.value,
                                            index,
                                            item,
                                            className: css({
                                                backgroundColor: highlightedIndex === index ? 'lightgray' : 'white',
                                                fontWeight: selectedItem === item ? 'bold' : 'normal',
                                            })
                                        })}
                                    >
                                        {item.label}
                                    </ListItem>
                                ))
                            : null}
                    </ul>
                </Menu>
            </EndOfBody>}
        </>
    }
}

