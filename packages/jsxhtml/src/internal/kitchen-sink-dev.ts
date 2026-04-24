#!/usr/bin/env -S bun --hot
import {serve, type ServerWebSocket} from "bun"
import {kitchenSink} from './kitchen-sink'


type WSData = {};

const port = 3000

declare global {
    var _clients: Set<ServerWebSocket<WSData>> | undefined
}


if(!globalThis._clients) {
    globalThis._clients = new Set<ServerWebSocket<WSData>>()
    console.log(`Dev server: http://localhost:${port}/`)
} else {
    console.log(`Dev server: Reloading ${globalThis._clients.size} clients...`)
    for(const ws of globalThis._clients) {
        ws.send("reload")
    }
}

const clients = globalThis._clients


function renderHtml(): string {
    return kitchenSink.toString()
}

function withLiveReload(html: string): string {
    const wsUrl = `ws://localhost:${port}/__live`
    const script = `
<!--START HOT_RELOAD-->
<script>
(() => {
  const ws = new WebSocket(${JSON.stringify(wsUrl)});
  ws.onmessage = (e) => { if (e.data === "reload") location.reload(); };
  ws.onclose = () => setTimeout(() => location.reload(), 150);
})();
</script>
<!--END HOT_RELOAD-->
`
    return html.includes("</body>")
        ? html.replace("</body>", script + "</body>")
        : html + script
}

// function broadcastReload(): void {
//     for (const ws of clients) ws.send("reload");
// }
//
// // Watch your source tree (adjust paths)
// const watchDir = resolve(import.meta.dir, "..", "src");
// watch(watchDir, { recursive: true }, (_event, filename) => {
//     if (!filename) return;
//     // optional: ignore temp files
//     if (filename.endsWith(".map") || filename.includes(".tmp")) return;
//     broadcastReload();
// });

serve({
    port,
    development: true,
    async fetch(req, server) {
        const url = new URL(req.url)

        if(url.pathname === "/__live") {
            if(server.upgrade(req, {data: {}})) return
            return new Response("Upgrade required", {status: 426})
        }

        if(url.pathname === "/" || url.pathname === "/kitchen-sink.html") {
            const html = withLiveReload(renderHtml())
            return new Response(html, {
                headers: {
                    "content-type": "text/html; charset=utf-8",
                    "cache-control": "no-store",
                },
            })
        }

        return new Response("Not found", {status: 404})
    },
    websocket: {
        open(ws: ServerWebSocket<WSData>) {
            clients.add(ws)
        },
        message(_ws: any, _message: any) {
            // required by types; keep as noop
        },
        close(ws: ServerWebSocket<WSData>) {
            clients.delete(ws)
        },
    },
})

