import { secrets } from "../../../secrets.js";

// Auth routes live under /smarttap/pilot3/auth, separate from the /api job routes in api.ts
const authBaseUrl = "https://agwater.org:5556/smarttap/pilot3/auth";

export type Pilot3User = {
  id?: string;
  username: string;
  email?: string;
  preferences?: string[];
  [key: string]: unknown;
};

export type Pilot3AuthResult = {
  user: Pilot3User;
  [key: string]: unknown;
};

export type LoginPayload = {
  username: string;
  password: string;
  totp_code: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  preferences: string[];
};

// /users/login responds with { authenticated: true, user } or { error, detail } on failure
export type Pilot3LoginResponse = {
  authenticated: true;
  user: Pilot3User;
};

type Pilot3LoginFailure = {
  error?: string;
  detail?: unknown;
};

type ApiEnvelope<T> = {
  success?: boolean;
  error?: string;
  message?: string;
  result?: T;
};

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || "Invalid JSON response" };
  }
}

function isLoginSuccess(body: unknown): body is Pilot3LoginResponse {
  return typeof body === "object" && body !== null && (body as Pilot3LoginResponse).authenticated === true;
}

async function login(payload: LoginPayload): Promise<Pilot3LoginResponse> {
  const response = await fetch(`${authBaseUrl}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": secrets.agwater_api_key,
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJson(response);
  if (!response.ok || !isLoginSuccess(body)) {
    const failure = body as Pilot3LoginFailure;
    const detail = typeof failure.detail === "string" ? failure.detail : undefined;
    throw new Error(failure.error || detail || `Request failed with HTTP ${response.status}`);
  }
  return body;
}

async function post<T>(path: string, payload: unknown): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${authBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": secrets.agwater_api_key,
    },
    body: JSON.stringify(payload),
  });

  const body = (await parseJson(response)) as ApiEnvelope<T>;
  if (!response.ok || body.success === false) {
    throw new Error(body.error || body.message || `Request failed with HTTP ${response.status}`);
  }
  return body;
}

export const pilot3Auth = {
  login,
  register: (payload: RegisterPayload) => post<Pilot3AuthResult>("/users/init", payload),
};
