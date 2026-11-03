// Valida contratos e observações SANITIZADAS; não efectua pedidos HTTP.
import assert from "node:assert/strict";
const actors=new Set(["AT","AF","DIR","GA","GB","CA","CB","EST","anon"]);
export function validateManifest(manifest) {
  assert.equal(manifest.executionMode,"DESCRIPTORS_ONLY_NO_HTTP_CLIENT");
  assert.equal(manifest.localFixtureIdsAreNotRemoteIds,true);
  const ids=new Set();
  for(const c of manifest.cases) {
    assert.ok(actors.has(c.actor));
    assert.ok(!ids.has(c.id)); ids.add(c.id);
    assert.ok(["GET","POST","PATCH","DELETE"].includes(c.method));
    assert.ok(c.path.startsWith("/rest/v1/")&&!c.path.includes("://")&&!c.path.startsWith("//"));
    assert.equal(c.headers.apikey,"{{PUBLISHABLE_KEY}}");
    assert.equal(c.headers.Authorization,c.actor==="anon"?undefined:"Bearer {{JWT_"+c.actor+"}}");
    assert.equal(c.remoteExecution,"REQUIRES_NEW_AUTHORIZATION");
    assert.ok(["rows","scalar","denial"].includes(c.expected.kind));
    if(c.method==="PATCH"||c.method==="DELETE") assert.ok(c.path.includes("?id=eq.{{UUID_"));
  }
  return ids.size;
}
export function validateObservation(spec,observed) {
  // Só recebem-se campos seleccionados, nunca tokens/cookies/corpos Auth.
  const allowed=new Set(["status","code","aliases","value","unchanged","knownExistingAliases","preconditionsVerified"]);
  assert.ok(Object.keys(observed).every(k=>allowed.has(k)),"Campo de evidência não permitido");
  if(spec.precondition) assert.equal(observed.preconditionsVerified,true);
  if(spec.kind==="denial") {
    assert.ok(spec.statuses.includes(observed.status));
    assert.ok(spec.codes.includes(observed.code));
    if(spec.unchangedRequired) assert.equal(observed.unchanged,true);
  } else {
    assert.equal(observed.status,spec.status);
    if(spec.kind==="rows") {
      assert.ok(Array.isArray(observed.aliases));
      assert.deepEqual([...observed.aliases].sort(),[...spec.aliases].sort());
      if(spec.requiresKnownExistingAlias) assert.ok(observed.knownExistingAliases?.includes(spec.requiresKnownExistingAlias));
    } else assert.equal(observed.value,spec.value);
  }
  return true;
}
