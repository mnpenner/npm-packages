export default [
    { name: 'optional', path: '/foo{/:bar}', component: () => import('./pages/Optional') },
]
