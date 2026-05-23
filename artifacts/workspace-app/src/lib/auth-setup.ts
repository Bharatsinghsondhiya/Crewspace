import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// Configure the API client to use our localStorage token
export function setupApiClient() {
  // If we have a production API URL (e.g. from Netlify/Vercel), point the client there.
  // Otherwise, it defaults to relative paths (which Vite proxies to localhost in dev).
  if (import.meta.env.VITE_API_URL) {
    setBaseUrl(import.meta.env.VITE_API_URL);
  }

  setAuthTokenGetter(() => {
    return localStorage.getItem("accessToken");
  });
}
