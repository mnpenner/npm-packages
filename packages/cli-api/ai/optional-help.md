Make the global help and version options/commands configurable. Use an API similar to below

```ts
app.help({
    name: 'aide',
    alias: ['a'],
    disableCommand: true,
    disableOption: false,
})
.version({
    name: 'versión',
    alias: 'V',
    disableCommand: false,
    disableOption: true,
})
```
