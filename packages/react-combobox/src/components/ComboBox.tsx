import * as React from 'react';
import Downshift from 'downshift'
import styled, {keyframes,css} from 'react-emotion';


const Select = styled.div`
    box-sizing: border-box;
    height: 1.909rem; // Need to set a height to get Firefox + Chrome to be the same. Has to be \`em\` so that it can scale with font-size. Use http://pxtoem.com/
    -moz-appearance: none;
    -webkit-appearance: none;
    border: 1px solid #b8b8b8;
    border-radius: 3px;
    //height: 2.25rem;
    //line-height: 1.5;
    padding: 0.182rem calc(0.545rem + 14px) 0.182rem 0.545rem; // Text will sit lower in FF unless we use em
    //padding-bottom: calc(0.375rem - 1px);
    //padding-left: calc(0.625rem - 1px);
    //padding-right: calc(0.625rem - 1px);
    //padding-top: calc(0.375rem - 1px);
    position: relative;
    vertical-align: top;
    color: #363636;
    cursor: pointer;
    display: block;
    //font: 12px Verdana, Geneva, Arial, Helvetica, sans-serif;
    width: 100% !important; // dropdown arrow won't appear in correct location without this
    max-width: 100% !important;
    outline: none;
       text-shadow: 0 1px 1px rgba(255, 255, 255, 0.75);
         background-color: #f5f5f5;
   background-image: linear-gradient(to bottom, #fff, #e6e6e6);
    background-repeat: repeat-x;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
    
    > option {
        background-color: #f5f5f5;
        //white-space: pre;
    }
       
         &:hover, &:active {
     color: #333;
    background-color: #e6e6e6;
  }
       
   &:hover {
        border-color: #a5a5a5;
           background-position: 0 -15px;
     transition: background-position .1s linear;
    }

    &[disabled] {
        cursor: not-allowed;
        //border-color: #c9c9c9;
        //background-image: linear-gradient(to bottom, #ffffff, #f7f7f7);
        color: #808080;
    }
    
    &::-ms-expand {
        display: none;
    }

    
    &:focus, &:active {
        outline: none;
        border-color: #23B3E8;
        //box-shadow: 0 0 5px #2980b9; // not sure how i feel about this...
        box-shadow: 0 1px 0 rgba(36, 182, 236, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
        //box-shadow: 0 0 0 2px rgba(220,80,90, .25);
    }
`;

const spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`
const dropdownArrow = css`
    &::after {
        width: 0;
        height: 0;
        margin-top: -3px;
        border-color: #808080 transparent transparent transparent;
        border-style: solid;
        border-width: 6px 5px 0 5px;
    }
    &:active::after {
          border-color: transparent transparent #808080 transparent;
             border-width: 0 5px 6px 5px;
    }
    &:hover::after {
       border-top-color: #666666;
    }
`;


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

const items = [
    {value: 'apple'},
    {value: 'pear'},
    {value: 'orange'},
    {value: 'grape'},
    {value: 'banana'},
]

export default function ComboBox() {
    
    return <>
        <select>
            <option>foo</option>
        </select>
        <Wrapper><Select>Hello</Select></Wrapper>
        </>;
    
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