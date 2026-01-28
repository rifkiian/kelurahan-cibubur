// API base URL configuration
export const API_BASE_URL = (import.meta.env.__API_BASE_URL__ as string) || "http://localhost:3001";

// Helper function for API calls
export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = endpoint.startsWith('/') 
    ? `${API_BASE_URL}${endpoint}`
    : `${API_BASE_URL}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
