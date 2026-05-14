import { NextRequest } from "next/server";

const FORWARD_HEADERS = new Set([
  "authorization",
  "content-type",
  "accept",
  "x-api-key",
]);

export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response("Missing ?url=", { status: 400 });
  }
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new Response("Only http(s) allowed", { status: 400 });
  }

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (FORWARD_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const upstream = await fetch(target.toString(), init);
    const body = await upstream.arrayBuffer();
    const responseHeaders = new Headers();
    const ct = upstream.headers.get("content-type");
    if (ct) responseHeaders.set("content-type", ct);
    return new Response(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream error";
    return new Response(message, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
