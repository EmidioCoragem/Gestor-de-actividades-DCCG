import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { consumePasswordSetup, issuePasswordSetup, sessionIdentity, consumeRecoveryRequest, issueRecoveryRequest, recoveryUserMatches, verifierFingerprint } from "../../src/modules/auth/password-setup";
import { localSession, localUserId } from "./auth-fixtures";
afterEach(() => vi.useRealTimers());
describe("Autorização de password ligada à sessão e de uso único", () => {
  it("consome uma única vez", () => {
    const identity = sessionIdentity(localSession().access_token, localUserId)!;
    const grant = issuePasswordSetup(identity, "recovery");
    expect(consumePasswordSetup(grant.nonce, identity)).toBe(true);
    expect(consumePasswordSetup(grant.nonce, identity)).toBe(false);
  });
  it("não aceita cookie inventado, outro utilizador ou outra sessão", () => {
    const identity = sessionIdentity(localSession().access_token, localUserId)!;
    const grant = issuePasswordSetup(identity, "recovery");
    expect(consumePasswordSetup("a".repeat(64), identity)).toBe(false);
    expect(consumePasswordSetup(grant.nonce, { ...identity, userId: "other" })).toBe(false);
    expect(consumePasswordSetup(grant.nonce, { ...identity, sessionId: "other" })).toBe(false);
    expect(consumePasswordSetup(grant.nonce, identity)).toBe(true);
  });
  it("expira em dez minutos", () => {
    vi.useFakeTimers();
    const identity = sessionIdentity(localSession().access_token, localUserId)!;
    const grant = issuePasswordSetup(identity, "recovery");
    vi.advanceTimersByTime(600_001);
    expect(consumePasswordSetup(grant.nonce, identity)).toBe(false);
  });
  it("não dura mais que o JWT verificado", () => {
    vi.useFakeTimers();
    const identity = sessionIdentity(localSession(localUserId, undefined, Math.floor(Date.now() / 1000) + 30).access_token, localUserId)!;
    const grant = issuePasswordSetup(identity, "invite");
    expect(grant.maxAge).toBeLessThanOrEqual(30);
    vi.advanceTimersByTime(31_000);
    expect(consumePasswordSetup(grant.nonce, identity)).toBe(false);
  });
  it("não identifica sessão inválida, expirada ou de outro utilizador", () => {
    expect(sessionIdentity("invalid", localUserId)).toBeNull();
    expect(sessionIdentity(localSession().access_token, "other")).toBeNull();
    expect(sessionIdentity(localSession(localUserId, "-".repeat(36)).access_token, localUserId)).toBeNull();
    expect(sessionIdentity(localSession(localUserId, undefined, 1).access_token, localUserId)).toBeNull();
  });
});

describe("Pedido iniciado no portal ligado ao verificador e destinatário", () => {
  const values = [{ name: "sb-fixture-auth-token-code-verifier", value: "synthetic-verifier" }];
  it("impressão ignora outros cookies mas detecta alteração do verificador", () => {
    expect(verifierFingerprint([])).toBeNull();
    expect(verifierFingerprint([...values, { name: "other", value: "cookie" }])).toBe(verifierFingerprint(values));
    expect(verifierFingerprint([{ ...values[0], value: "changed" }])).not.toBe(verifierFingerprint(values));
  });
  it("exige o mesmo verificador e só consome uma vez", () => {
    const fp = verifierFingerprint(values)!;
    const nonce = issueRecoveryRequest("at@example.invalid", fp);
    expect(consumeRecoveryRequest("invented", fp)).toBeNull();
    expect(consumeRecoveryRequest(nonce, "changed")).toBeNull();
    const request = consumeRecoveryRequest(nonce, fp)!;
    expect(recoveryUserMatches("AT@example.invalid", request.emailHash)).toBe(true);
    expect(recoveryUserMatches("other@example.invalid", request.emailHash)).toBe(false);
    expect(consumeRecoveryRequest(nonce, fp)).toBeNull();
  });
  it("expira sem dar autorização", () => {
    vi.useFakeTimers();
    const fp = verifierFingerprint(values)!;
    const nonce = issueRecoveryRequest("at@example.invalid", fp);
    vi.advanceTimersByTime(600_001);
    expect(consumeRecoveryRequest(nonce, fp)).toBeNull();
  });
});
