import { NextRequest } from "next/server";

const apiUrl =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3050";

const blockedRequestHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
]);

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetUrl = new URL(
    `/v1/${path.map((segment) => encodeURIComponent(segment)).join("/")}`,
    `${apiUrl.replace(/\/$/, "")}/`,
  );

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const requestHeaders = new Headers(request.headers);
  blockedRequestHeaders.forEach((header) => requestHeaders.delete(header));

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: requestHeaders,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  // Set-Cookie는 브라우저가 웹 도메인의 쿠키로 저장하도록 그대로 전달함
  const headersWithSetCookie = upstream.headers as Headers & {
    getSetCookie?: () => string[];
  };
  responseHeaders.delete("set-cookie");
  for (const cookie of headersWithSetCookie.getSetCookie?.() ?? []) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
