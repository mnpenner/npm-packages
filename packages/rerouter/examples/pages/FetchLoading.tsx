import { use } from 'react'
import { NavLink, Router, type RouteObject } from '../../src'
import FetchLoadingItem from './FetchLoadingItem'
import * as routesGen from '../routes.gen'

const itemRoutes: readonly RouteObject[] = [
    {
        pattern: '/fetch-loading/:id',
        component: async () => ({ default: FetchLoadingItem }),
    },
]

type FetchResult = {
    message: string
    loadedAt: string
}

const fetchResult = new Promise<FetchResult>((resolve) => {
    setTimeout(() => {
        resolve({
            message: 'The route component loaded immediately, then Suspense waited for data.',
            loadedAt: new Date().toLocaleTimeString(),
        })
    }, 2000)
})

export default function FetchLoading() {
    const result = use(fetchResult)
    const itemIds = ['abc-123', 'invoice-456', 'with/slash']

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Fetch loading page</h2>
            <div>{result.message}</div>
            <div style={{ marginTop: 8, opacity: 0.8 }}>Loaded at {result.loadedAt}</div>
            <div className="nav" style={{ marginTop: 16 }}>
                {itemIds.map((id) => (
                    <NavLink
                        activeClass="active"
                        className="pill"
                        key={id}
                        to={routesGen.fetchLoadingItem({ id })}
                    >
                        Fetch {id}
                    </NavLink>
                ))}
            </div>
            <div style={{ marginTop: 16 }}>
                <Router routes={itemRoutes} loading={<div>Loading item...</div>} />
            </div>
        </div>
    )
}
