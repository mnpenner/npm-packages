export default [
    { name: 'home', path: '/', component: () => import('./pages/Home') },
    { path: '/layout/:id', component: () => import('./pages/Home') },
]
