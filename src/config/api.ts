// All API requests go through Next.js rewrites (/api → Railway backend).
// This eliminates CORS issues because the browser only talks to the same origin.
export const API_BASE_URL = '/api';
