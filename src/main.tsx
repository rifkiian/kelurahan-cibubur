import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { API_BASE_URL } from "@/lib/api";

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === "string") {
    if (input.startsWith("/api") || input.startsWith("/uploads")) {
      return originalFetch(`${API_BASE_URL}${input}`, init);
    }
    return originalFetch(input, init);
  }

  if (input instanceof Request) {
    try {
      const u = new URL(input.url);
      if (
        u.origin === window.location.origin &&
        (u.pathname.startsWith("/api") || u.pathname.startsWith("/uploads"))
      ) {
        const newUrl = `${API_BASE_URL}${u.pathname}${u.search}${u.hash}`;
        return originalFetch(new Request(newUrl, input), init);
      }
    } catch {
      // ignore
    }
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
