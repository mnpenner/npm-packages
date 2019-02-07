import React from 'react';

declare global {
    const React: typeof React
    type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
}

