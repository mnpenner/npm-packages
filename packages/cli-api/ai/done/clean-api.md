
```ts
export const Command: new (name: string) => FluentCommand<[], [], [], [], false> = FluentCommand
export const App: new (name: string) => FluentApp<[], [], [], [], false> = FluentApp
```

Clean up the API and drop the word "Fluent" from things. We don't need Command as an alias for FluentCommand.
