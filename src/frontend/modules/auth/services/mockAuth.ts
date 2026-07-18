import type { LoginCredentials, RegisterPayload } from "../types";

/** Static demo: any non-empty password succeeds. */
export function mockLogin(credentials: LoginCredentials): {
  ok: boolean;
  displayName: string;
  email: string;
} {
  const email = credentials.email.trim();
  const ok = email.length > 0 && credentials.password.length > 0;
  return {
    ok,
    displayName: email.split("@")[0] || "User",
    email: email || "guest@demo.local",
  };
}

export function mockRegister(payload: RegisterPayload): {
  ok: boolean;
  displayName: string;
  email: string;
} {
  const name = payload.displayName.trim();
  const email = payload.email.trim();
  const ok = name.length > 0 && email.length > 0 && payload.password.length > 0;
  return {
    ok,
    displayName: name,
    email: email || "guest@demo.local",
  };
}
