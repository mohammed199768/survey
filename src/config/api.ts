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

const rawApiBaseUrl =
  viteApiUrl ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

const withoutTrailingSlash = rawApiBaseUrl.replace(/\/+$/, '');

export const API_BASE_URL = withoutTrailingSlash.endsWith('/api')
  ? withoutTrailingSlash
  : `${withoutTrailingSlash}/api`;
