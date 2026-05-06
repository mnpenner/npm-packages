import { use } from 'react'

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

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Fetch loading page</h2>
            <div>{result.message}</div>
            <div style={{ marginTop: 8, opacity: 0.8 }}>Loaded at {result.loadedAt}</div>
        </div>
    )
}
