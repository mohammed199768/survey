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

// Single source for frontend origin (change once in env and it propagates everywhere).
const appOrigin =
  process.env.NEXT_PUBLIC_APP_ORIGIN ||
  viteApiUrl ||
  'https://survey-one-beryl.vercel.app';

const withoutTrailingSlash = appOrigin.replace(/\/+$/, '');

export const API_BASE_URL = withoutTrailingSlash.endsWith('/api')
  ? withoutTrailingSlash
  : `${withoutTrailingSlash}/api`;
