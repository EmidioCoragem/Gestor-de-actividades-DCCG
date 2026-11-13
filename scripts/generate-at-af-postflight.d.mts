export const EXPECTED_HASHES: Readonly<{ original: string; incremental: string; baselineChecker: string }>;
export function assertSelectOnly(sql: string): true;
export function buildAtAfPostflight(sources: { original: string; incremental: string; baselineChecker: string }): string;
export function buildAtAfPreBaseline(sources: { original: string; incremental: string; baselineChecker: string }): string;
