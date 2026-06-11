import { NextResponse } from "next/server";
import net from "net";

export async function GET(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const portStr = searchParams.get("port");

    if (!portStr) {
        return NextResponse.json({ error: "Port is required" }, { status: 400 });
    }

    const port = parseInt(portStr.replace(":", ""), 10);
    const host = "localhost"; // Assume all services are running on localhost/docker

    return new Promise<Response>((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();

        // Timeout if ping takes longer than 2 seconds
        socket.setTimeout(2000);

        socket.on("connect", () => {
            const ping = Date.now() - start;
            socket.destroy();
            resolve(NextResponse.json({ status: "online", ping }));
        });

        socket.on("timeout", () => {
            socket.destroy();
            resolve(NextResponse.json({ status: "offline", ping: 0, error: "Connection timed out" }, { status: 504 }));
        });

        socket.on("error", (err) => {
            socket.destroy();
            resolve(NextResponse.json({ status: "offline", ping: 0, error: err.message }, { status: 502 }));
        });

        socket.connect(port, host);
    });
}
