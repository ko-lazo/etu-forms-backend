export const HTTP_METHOD = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];

export type HttpRequest = {
  readonly method: HttpMethod;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
  readonly timeoutMs?: number;
};

export function sendHttpRequest(
  url: string,
  request: HttpRequest,
): Promise<Response> {
  const hasBody = request.body !== undefined;

  const init: RequestInit = {
    method: request.method,
    headers: {
      ...(hasBody && { "Content-Type": "application/json" }),
      ...request.headers,
    },
    body: hasBody ? JSON.stringify(request.body) : null,
  };

  if (request.timeoutMs !== undefined) {
    init.signal = AbortSignal.timeout(request.timeoutMs);
  }

  return fetch(url, init);
}
