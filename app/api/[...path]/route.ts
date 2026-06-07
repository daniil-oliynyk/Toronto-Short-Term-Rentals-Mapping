type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: Request, context: RouteContext) {
  const startedAt = Date.now();
  const { path } = await context.params;

  try {
    const upstreamURL = getUpstreamURL(request.url, path);

    console.info("[api-proxy] request", {
      method: request.method,
      upstreamURL: upstreamURL.toString(),
    });

    const response = await fetch(upstreamURL, {
      headers: {
        Accept: request.headers.get("accept") ?? "application/json",
        "X-Internal-API-Key": getInternalAPIKey(),
      },
      signal: request.signal,
    });

    console.info("[api-proxy] response", {
      durationMs: Date.now() - startedAt,
      method: request.method,
      ok: response.ok,
      status: response.status,
      upstreamURL: upstreamURL.toString(),
    });

    return new Response(response.body, {
      headers: responseHeaders(response.headers),
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error("[api-proxy] request failed", {
      durationMs: Date.now() - startedAt,
      error,
      method: request.method,
      path: `/api/${path.join("/")}`,
    });

    return Response.json(
      { error: "The backend API could not be reached" },
      { status: 502 },
    );
  }
}

function getUpstreamURL(requestURL: string, path: string[]): URL {
  const apiBaseURL = process.env.API_BASE_URL;
  if (!apiBaseURL) {
    throw new Error("API_BASE_URL is not configured");
  }

  const incomingURL = new URL(requestURL);
  const upstreamURL = new URL(
    `/api/${path.map(encodeURIComponent).join("/")}`,
    `${apiBaseURL.replace(/\/+$/, "")}/`,
  );
  upstreamURL.search = incomingURL.search;

  return upstreamURL;
}

function getInternalAPIKey(): string {
  const internalAPIKey = process.env.INTERNAL_API_KEY?.trim();
  if (!internalAPIKey) {
    throw new Error("INTERNAL_API_KEY is not configured");
  }

  return internalAPIKey;
}

function responseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers();

  for (const name of ["cache-control", "content-type", "etag", "last-modified"]) {
    const value = upstreamHeaders.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  return headers;
}
