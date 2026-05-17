export function createStartStream<R = any>(
    fn: (controller: ReadableStreamDefaultController<R>) => void | Promise<void>,
) {
    return new ReadableStream({
        start(controller) {
            fn(controller)
        },
    })
}

interface StreamWriter<R = any> {
    write(chunk: R): void
    // error(e?: any): void
}

export function createAsyncStream<R = any>(
    fn: (controller: StreamWriter<R>) => void | Promise<void>,
) {
    return new ReadableStream({
        start(controller) {
            const writer: StreamWriter<R> = {
                write: controller.enqueue.bind(controller),
                // error: controller.error.bind(controller),
            }
            Promise.try(fn, writer).then(
                () => {
                    controller.close()
                },
                (err) => {
                    controller.error(err)
                },
            )
        },
    })
}
