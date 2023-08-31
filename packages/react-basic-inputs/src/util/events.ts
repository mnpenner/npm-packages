import {EventHandler, SyntheticEvent} from "react";


interface InputProps<E extends SyntheticEvent<any>> {
    onChange?: EventHandler<E>
    onInput?: EventHandler<E>
    onBlur?: EventHandler<E>
}

function useNativeEvents<E extends SyntheticEvent<any>>({onChange, onInput, onBlur}: InputProps<E>) {
    // TODO........dis-entangle and return proper events
}
