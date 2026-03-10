declare const __API_BASE_URL__: string | undefined;

const injectedBase = typeof __API_BASE_URL__ === "string" ? __API_BASE_URL__.trim() : "";
const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
const isProbablyInvalidInjectedBase =
  !injectedBase ||
  injectedBase.includes("your-backend-url.railway.app") ||
  (!/^https?:\/\//i.test(injectedBase) && injectedBase !== "/");

export const API_BASE_URL = (isProbablyInvalidInjectedBase
  ? browserOrigin || "http://localhost:3001"
  : injectedBase
).replace(/\/$/, "");

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
