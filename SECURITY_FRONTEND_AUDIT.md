# Frontend Security Audit

## 1. Critical Vulnerabilities

### 🔴 JWT Storage in LocalStorage
**File**: `src/lib/api/client.ts`
```typescript
const JWT_TOKEN_KEY = 'admin_jwt_token';
// ...
localStorage.getItem(JWT_TOKEN_KEY);
```
**Risk**: **High**. Storing sensitive authentication tokens in `localStorage` makes them accessible to any JavaScript running on the page (XSS attacks). If an attacker injects a script, they can steal the admin token.
**Remediation**:
1.  Store tokens in **HttpOnly, Secure Cookies**.
2.  The Backend should set the cookie. The Frontend should just use `credentials: 'include'`.
3.  Do not access the token via JS.

### 🟡 Missing Content Security Policy (CSP)
**Status**: Not found in `next.config.js` (assumed default).
**Risk**: **Medium**. Without CSP, the application is vulnerable to Data Injection, XSS, and Clickjacking.
**Remediation**: Configure `csp` headers in `next.config.js`. Allow only trusted domains (APIs, Fonts, Scripts).

### 🟡 XSS Prevention
**File**: `ExecutiveSummaryCard.tsx`
**Status**: **Safe** (Current implementation uses React children).
**Note**: The Prompt mentioned a "Potential XSS". If you ever act on that advice and use `dangerouslySetInnerHTML` for the summary, you **MUST** use `dompurify`.
```typescript
// SAFE
<div>{model.summary}</div>

// UNSAFE
<div dangerouslySetInnerHTML={{ __html: model.summary }} />

// SECURE
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(model.summary) }} />
```

## 2. Authentication & Authorization

### Client-Side Auth Checks
**File**: `src/app/admin/layout.tsx`
```typescript
if (!isAuthenticated) return null;
```
**Risk**: **Low/Medium**. The "Admin" pages are protected by JavaScript. If JS is disabled or fails, content might flash? (React usually handles this).
**Real Risk**: API endpoints are the real gatekeepers. Ensure ALL `/admin/*` API endpoints validate the token.
**Recommendation**: Use **Middleware** (`middleware.ts`) to protect the `/admin` routes at the server level. This prevents the admin JS bundle from even being sent to unauthenticated users.

## 3. Dependency Security
-   Project uses standard libraries (`lucide-react`, `framer-motion`, `zustand`).
-   **Action**: regularly run `npm audit` to ensure no supply-chain vulnerabilities.

## 4. Security Roadmap

### Immediate Priority
1.  **Migrate Auth to Cookies**: Switch from `localStorage` to HttpOnly cookies. This requires Backend changes to set the cookie, and Frontend `api/client.ts` to stop sending `Authorization` header manually and instead use `credentials: 'include'`.

### High Priority
2.  **Implement Middleware**: Create `src/middleware.ts` to block access to `/admin` for unauthorized users.
3.  **Add CSP**: harden `next.config.js`.

### Medium Priority
4.  **Rate Limiting**: Ensure the API limits requests (Login attempts) to prevent Brute Force. (Backend concern, but frontend should handle 429 errors gracefully).
