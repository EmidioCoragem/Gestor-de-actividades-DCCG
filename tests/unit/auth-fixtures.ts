export const localUserId = "50000000-0000-4000-8000-000000000001";
export const localSessionId = "60000000-0000-4000-8000-000000000001";
export function localSession(userId = localUserId, sessionId = localSessionId, expires = Math.floor(Date.now() / 1000) + 3600) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return {
    access_token: encode({ alg: "HS256", typ: "JWT" }) + "." + encode({ sub: userId, session_id: sessionId, aud: "authenticated", role: "authenticated", exp: expires }) + ".local-synthetic-only",
    refresh_token: "local-synthetic-refresh", expires_at: expires, expires_in: 3600, token_type: "bearer",
    user: { id: userId, aud: "authenticated", email: "at@example.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-11-04T00:00:00Z" },
  };
}
