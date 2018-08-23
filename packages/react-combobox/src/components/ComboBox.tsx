import * as React from 'react';
import Downshift, {GetItemPropsOptions} from 'downshift'
import styled, {keyframes,css} from 'react-emotion';

const dropdownArrow = css`
    &::after {
        width: 0;
        height: 0;
        margin-top: -3px;
        border-color: #808080 transparent transparent transparent;
        border-style: solid;
        border-width: 6px 5px 0 5px;
    }
    //&:active::after {
    //      border-color: transparent transparent #808080 transparent;
    //         border-width: 0 5px 6px 5px;
    //}
    //&:hover::after {
    //   border-top-color: #666666;
    //}
`;


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

const Arrow = styled.span`
    width: 0;
    height: 0;
    border-style: solid;

    ${({isOpen}: ArrowProps) => isOpen ? css`
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


const Wrapper = styled.div`
    display: inline-block;
    max-width: 100%;
    position: relative;
    vertical-align: baseline;
    cursor: pointer;
    
    &::after {
        position: absolute;
        top: 50%;
        right: 8px;
        display: block;
        content: ' ';
        pointer-events: none;
    }
        
    ${({loading}: {loading?:boolean}) => loading ? css`
        &::after {
            animation: ${spin} 600ms infinite linear;
            border: 2px solid #c0c0c0;
            border-radius: 50%;
            //border-right-color: transparent;
            border-top-color: transparent;
            box-sizing: border-box;
            width: 14px;
            height: 14px;
            right: 6px;
            margin-top: -7px;
        }
        
        &:hover::after {
           border-color: #a6a6a6;
            border-top-color: transparent;
        }
        //&:active::after {
        //    border-color: #dc505a;
        //    border-top-color: transparent;
        //}
    ` : dropdownArrow}    
 
`;


interface Item {
    value: string
}

const items: Item[] = [
    {value: 'apple'},
    {value: 'pear'},
    {value: 'orange'},
    {value: 'grape'},
    {value: 'banana'},
]

type ListItemProps = GetItemPropsOptions<Item>

// const ListItem = styled.li`
//     background-color: ${({highlightedIndex,index}: ListItemProps) => highlightedIndex === index ? 'lightgray' : 'white'};
//     font-weight: ${({selectedItem,item}: ListItemProps) => selectedItem === item ? 'bold' : 'normal'};
// `

const ListItem = styled.li<ListItemProps>``

export default class ComboBox extends React.Component {
    
    
    render() {
        return <Downshift itemToString={item => (item ? item.value : '')}>{({toggleMenu,isOpen,getInputProps,getMenuProps,inputValue,getItemProps,highlightedIndex,selectedItem}) => <div>
            <Container onClick={() => toggleMenu()}>{selectedItem ? selectedItem.value : "Please Choose"}<Arrow isOpen={isOpen}/></Container>
            {isOpen && <div>
                <input {...getInputProps({autoFocus:true})}/>
                <ul {...getMenuProps()}>
                    {isOpen
                        ? items
                            .filter(item => !inputValue || item.value.includes(inputValue))
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
                                    {item.value}
                                </ListItem>
                            ))
                        : null}
                </ul>
            </div>}
        </div>}
        </Downshift>;
    }
}

function OldComboBox() {
    

    
    return <Downshift
        onChange={selection => alert(`You selected ${selection.value}`)}
        itemToString={item => (item ? item.value : '')}
    >
        {({
              getInputProps,
              getItemProps,
              getLabelProps,
              getMenuProps,
              isOpen,
              inputValue,
              highlightedIndex,
              selectedItem,
          }) => (
            <div>
                <label {...getLabelProps()}>Enter a fruit</label>
                <input {...getInputProps()} />
                <ul {...getMenuProps()}>
                    {isOpen
                        ? items
                            .filter(item => !inputValue || item.value.includes(inputValue))
                            .map((item, index) => (
                                <li
                                    {...getItemProps({
                                        key: item.value,
                                        index,
                                        item,
                                        style: {
                                            backgroundColor:
                                                highlightedIndex === index ? 'lightgray' : 'white',
                                            fontWeight: selectedItem === item ? 'bold' : 'normal',
                                        },
                                    })}
                                >
                                    {item.value}
                                </li>
                            ))
                        : null}
                </ul>
            </div>
        )}
    </Downshift>
}