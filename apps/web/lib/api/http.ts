import { getApiBaseUrl, REQUEST_TIMEOUT_MS } from './config';
import { ApiError, ApiErrorKind, ApiResult, CLIENT_ERROR_CODES } from './types';

/**
 * Centralized HTTP transport for the EventSphere API.
 *
 * Every endpoint module goes through `request()`, so error classification,
 * timeouts, and response parsing are defined exactly once. Endpoint modules
 * stay thin and declarative; UI components never touch `fetch` directly.
 */

/** Shape the backend uses for every error response: `{ error, message }`. */
interface BackendErrorBody {
  error?: unknown;
  message?: unknown;
}

/**
 * Maps HTTP status to a transport-level kind.
 *
 * This is the mirror image of the backend's `KIND_TO_HTTP_STATUS`: the server
 * translates business meaning down to a status code, and the client translates
 * that status back up into a category the UI can reason about.
 */
function kindFromStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'VALIDATION';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'SERVER' : 'UNKNOWN';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extracts the backend's error envelope defensively.
 *
 * A non-JSON body is entirely possible in practice — a proxy or load balancer
 * can return an HTML error page that never touched our Express app — so this
 * must not assume the body parses or has the expected shape.
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  const kind = kindFromStatus(response.status);
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return {
      kind,
      code: CLIENT_ERROR_CODES.MALFORMED_RESPONSE,
      message: `Server returned ${response.status} with a non-JSON body`,
      status: response.status,
    };
  }

  const candidate: BackendErrorBody = isRecord(body) ? body : {};
  const code = typeof candidate.error === 'string' ? candidate.error : CLIENT_ERROR_CODES.MALFORMED_RESPONSE;
  const message =
    typeof candidate.message === 'string' ? candidate.message : `Request failed with status ${response.status}`;

  return { kind, code, message, status: response.status };
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Performs an API request and returns a discriminated union.
 *
 * Never throws for transport or HTTP failures — callers get `{ ok: false }`
 * with a classified error instead, so a component cannot accidentally leave a
 * rejection unhandled.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, signal } = options;
  const url = `${getApiBaseUrl()}${path}`;

  // Caller-supplied cancellation (e.g. component unmount) is combined with our
  // own deadline, so whichever fires first aborts the request.
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
      signal: combinedSignal,
    });
  } catch (error) {
    // fetch rejects for network-level failures and aborts alike; distinguish
    // them so the UI can say "couldn't reach the server" vs "took too long".
    const isTimeout = timeoutSignal.aborted;
    return {
      ok: false,
      error: {
        kind: isTimeout ? 'TIMEOUT' : 'NETWORK',
        code: isTimeout ? CLIENT_ERROR_CODES.REQUEST_TIMEOUT : CLIENT_ERROR_CODES.NETWORK_UNREACHABLE,
        message: error instanceof Error ? error.message : 'Request failed before reaching the server',
      },
    };
  }

  if (!response.ok) {
    return { ok: false, error: await parseErrorResponse(response) };
  }

  // 204 and other empty-body successes have nothing to parse.
  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }

  try {
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return {
      ok: false,
      error: {
        kind: 'UNKNOWN',
        code: CLIENT_ERROR_CODES.MALFORMED_RESPONSE,
        message: 'Server returned a success status with an unreadable body',
        status: response.status,
      },
    };
  }
}
