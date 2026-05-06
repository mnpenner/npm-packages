import { use } from 'react'

type FetchLoadingItemProps = {
    id: string
}

type FetchResult = {
    id: string
    message: string
    loadedAt: string
}

const fetchResults = new Map<string, Promise<FetchResult>>()

function fetchItem(id: string): Promise<FetchResult> {
    let result = fetchResults.get(id)
    if (!result) {
        result = new Promise<FetchResult>((resolve) => {
            setTimeout(() => {
                resolve({
                    id,
                    message: `Fetched fake data for item ${id}.`,
                    loadedAt: new Date().toLocaleTimeString(),
                })
            }, 2000)
        })
        fetchResults.set(id, result)
    }
    return result
}

export default function FetchLoadingItem({ id }: FetchLoadingItemProps) {
    const result = use(fetchItem(id))

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Fetch loading item</h2>
            <div>
                URL param: <code>{result.id}</code>
            </div>
            <div style={{ marginTop: 8 }}>{result.message}</div>
            <div style={{ marginTop: 8, opacity: 0.8 }}>Loaded at {result.loadedAt}</div>
        </div>
    )
}
