type ImportMetaEnvLike = {
  VITE_API_URL?: string;
};

type ImportMetaLike = ImportMeta & {
  env?: ImportMetaEnvLike;
};

const viteApiUrl =
  typeof import.meta !== 'undefined'
    ? (import.meta as ImportMetaLike).env?.VITE_API_URL
    : undefined;

const envApiBaseUrl = viteApiUrl || process.env.NEXT_PUBLIC_API_URL;

const rawApiBaseUrl =
  envApiBaseUrl ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

if (!rawApiBaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_API_URL. Set it in Vercel Project Settings -> Environment Variables.',
  );
}

const withoutTrailingSlash = rawApiBaseUrl.replace(/\/+$/, '');

export const API_BASE_URL = withoutTrailingSlash.endsWith('/api')
  ? withoutTrailingSlash
  : `${withoutTrailingSlash}/api`;
