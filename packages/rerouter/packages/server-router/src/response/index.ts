
export function createStartStream<R=any>(fn: (controller:  ReadableStreamDefaultController<R>) => void|Promise<void>) {
    return new ReadableStream({
        start(controller) {
            fn(controller)
        }
    })
}

interface StreamWriter<R = any> {
    write(chunk: R): void
    // error(e?: any): void
}

export function createAsyncStream<R = any>(fn: (controller: StreamWriter<R>) => void | Promise<void>) {
    return new ReadableStream({
        start(controller) {
            const writer: StreamWriter<R> = {
                write: controller.enqueue.bind(controller),
                // error: controller.error.bind(controller),
            }
            Promise.try(fn, writer).then(() => {
                controller.close()
            }, err => {
                controller.error(err)
            })
        }
    })
}

// See also https://bun.sh/docs/api/streams#async-generator-streams

export async function createJsonLinesResponse<T>(
    generator: AsyncGenerator<T>
): Promise<Response> {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const item of generator) {
                    controller.enqueue(encoder.encode(JSON.stringify(item) + '\n'));
                }
            } catch (error) {
                controller.error(error);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "application/jsonl; charset=utf-8",
        },
    });
}

export async function createSseResponse<T>(
    generator: AsyncGenerator<T>
): Promise<Response> {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const item of generator) {
                    const data = `data: ${JSON.stringify(item)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                }
            } catch (error) {
                controller.error(error);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

export {openapi} from './openapi'
export type {OpenApiDocument, OpenApiInfo, OpenApiOptions, OpenApiServer} from './openapi'
