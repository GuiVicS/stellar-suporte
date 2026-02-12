/** HTTP client helpers – apiGet, apiPost, apiPut, apiPatch, apiDelete */

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      "Erro ao comunicar com o servidor.";
    throw new Error(message);
  }
  return data as T;
}

export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPut<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string) {
  return apiRequest<T>(path, { method: "DELETE" });
}
