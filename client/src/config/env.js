/**
 * Validates client-side environment at startup.
 * In production builds, VITE_API_URL should point to the deployed API host.
 */
export function validateClientEnv() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const isProd = import.meta.env.PROD;

  if (isProd && !apiUrl) {
    console.warn(
      "[Findora] VITE_API_URL is not set. API and Socket.IO will use the frontend origin, which may fail on static hosts like Vercel."
    );
  }

  if (apiUrl) {
    try {
      new URL(apiUrl);
    } catch {
      throw new Error(`Invalid VITE_API_URL: ${apiUrl}`);
    }
  }

  return { apiUrl: apiUrl || "" };
}
