import { describe, expect, it } from "vitest";
import { runLocalSuite } from "../../scripts/etapa-c/runner.mjs";
describe("Etapa C — cenários exclusivamente locais", () => {
  it("exercita 32 cenários com oito identidades e sem persistir mutações", async () => {
    const report = await runLocalSuite();
    expect(report.mode).toBe("PGLITE_MEMORY_ONLY");
    expect(report.remoteExecuted).toBe(false);
    expect(report.results).toHaveLength(32);
    expect(new Set(report.results.map(r => r.id)).size).toBe(32);
    expect(new Set(report.results.map(r => r.actor))).toEqual(
      new Set(["anon", "AT", "AF", "DIR", "GA", "GB", "CA", "CB", "EST"]),
    );
    expect(report.results.every(r => r.result === "LOCAL_PASS" && r.remote === "NOT_EXECUTED")).toBe(true);
  }, 120000);
});
