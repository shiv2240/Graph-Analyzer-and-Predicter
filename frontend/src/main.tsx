import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import "./index.css";
// Filter out noise from browser extensions (e.g. crypto wallets, adblockers)
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason || "");
    const stack = event.reason?.stack || "";
    if (
      reason.includes("Could not establish connection") ||
      reason.includes("Receiving end does not exist") ||
      reason.includes("useCache") ||
      stack.includes("content.js") ||
      stack.includes("polyfill.js") ||
      stack.includes("chrome-extension://")
    ) {
      event.preventDefault(); // Suppress extension uncaught rejection
    }
  });

  window.addEventListener("error", (event) => {
    const filename = event.filename || "";
    const msg = event.message || "";
    if (
      filename.includes("content.js") ||
      filename.includes("polyfill.js") ||
      filename.includes("chrome-extension://") ||
      msg.includes("useCache") ||
      msg.includes("Receiving end does not exist")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — matches backend cache TTL
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
