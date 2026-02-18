'use client';

export const ADMIN_AUTH_MARKER_COOKIE_NAME = 'admin_authenticated';
const ADMIN_AUTH_MARKER_COOKIE_VALUE = '1';
const ADMIN_AUTH_MARKER_MAX_AGE_SECONDS = 24 * 60 * 60;

const canUseDocument = (): boolean => typeof document !== 'undefined';

const secureSuffix = (): string =>
  typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';

export const setAdminAuthMarker = (): void => {
  if (!canUseDocument()) {
    return;
  }

  document.cookie = `${ADMIN_AUTH_MARKER_COOKIE_NAME}=${ADMIN_AUTH_MARKER_COOKIE_VALUE}; Path=/; Max-Age=${ADMIN_AUTH_MARKER_MAX_AGE_SECONDS}; SameSite=Lax${secureSuffix()}`;
};

export const clearAdminAuthMarker = (): void => {
  if (!canUseDocument()) {
    return;
  }

  document.cookie = `${ADMIN_AUTH_MARKER_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secureSuffix()}`;
};

export const hasAdminAuthMarker = (): boolean => {
  if (!canUseDocument()) {
    return false;
  }

  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${ADMIN_AUTH_MARKER_COOKIE_NAME}=`));
};
