export default [
    { name: 'home', pattern: '/', component: () => import('./pages/Home') },
    { pattern: '/layout/:id', component: () => import('./pages/Home') },
]
