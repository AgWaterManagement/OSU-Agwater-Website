const apiBaseUrl = (
  import.meta.env.VITE_SMARTTAP_API_BASE ?? "/apps/smarttap/pilot1"
)
  .trim()
  .replace(/\/+$/, "");

function resolveRequestPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!apiBaseUrl) {
    return normalizedPath;
  }

  return `${apiBaseUrl}${normalizedPath}`;
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(resolveRequestPath(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    const responseBody = await response.text();

    if (responseBody) {
      try {
        const payload = JSON.parse(responseBody) as {
          detail?: unknown;
          error?: unknown;
        };

        if (typeof payload.detail === "string") {
          message = payload.detail;
        } else if (typeof payload.error === "string") {
          message = payload.error;
        } else {
          message = responseBody;
        }
      } catch {
        message = responseBody;
      }
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
