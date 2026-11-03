export type LocalResult = { id: string; actor: string; result: "LOCAL_PASS"; remote: "NOT_EXECUTED" };
export type LocalReport = { mode: "PGLITE_MEMORY_ONLY"; remoteExecuted: false; results: LocalResult[] };
export function runLocalSuite(): Promise<LocalReport>;
