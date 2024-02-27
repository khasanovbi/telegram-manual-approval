export function inverseMap<K, V>(m: Map<K, V>): Map<V, K> {
    const result = new Map<V, K>()
    for (const [key, value] of m.entries()) {
        result.set(value, key)
    }

    return result
}

export async function awaitTimeout(delay: number, reason: Error): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => (reason === undefined ? resolve() : reject(reason)), delay)
        timeout.unref()
    })
}
