declare const __API_BASE_URL__: string | undefined;

export const API_BASE_URL = (typeof __API_BASE_URL__ === "string" && __API_BASE_URL__.trim()
  ? __API_BASE_URL__
  : "http://localhost:3001").replace(/\/$/, "");

export const apiUrl = (endpoint: string) => {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers: {
      ...(!(options?.body instanceof FormData) ? { "Content-Type": "application/json" } : null),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
