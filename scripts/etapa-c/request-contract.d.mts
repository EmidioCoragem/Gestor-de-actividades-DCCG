export type RequestManifest = Record<string, unknown>;
export function validateManifest(manifest: unknown): number;
export function validateObservation(spec: Record<string, unknown>, observed: Record<string, unknown>): boolean;
