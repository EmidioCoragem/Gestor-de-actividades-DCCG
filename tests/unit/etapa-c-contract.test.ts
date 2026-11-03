import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { validateManifest, validateObservation } from "../../scripts/etapa-c/request-contract.mjs";
const manifest=JSON.parse(await readFile("docs/fase-1/etapa-c/postgrest-pedidos.json","utf8"));
describe("Etapa C — contratos offline PostgREST",()=>{
  it("aceita só descritores relativos e identidades normais",()=>{
    expect(validateManifest(manifest)).toBe(20);
    const bad=structuredClone(manifest);
    bad.cases[0].actor="service_role";
    expect(()=>validateManifest(bad)).toThrow();
    const live=structuredClone(manifest);
    live.cases[0].path="https://project.example/rest/v1/profiles";
    expect(()=>validateManifest(live)).toThrow();
  });
  it("não aprova isolamento por 200 ou vazio sem confirmar o alvo",()=>{
    const spec={kind:"rows",status:200,aliases:[],requiresKnownExistingAlias:"B"};
    expect(()=>validateObservation(spec,{status:200,aliases:[]})).toThrow();
    expect(validateObservation(spec,{status:200,aliases:[],knownExistingAliases:["B"]})).toBe(true);
  });
  it("não confunde erro de sintaxe/integridade ou mutação com recusa autorizativa",()=>{
    const spec={kind:"denial",statuses:[400],codes:["P0001"],unchangedRequired:true};
    expect(()=>validateObservation(spec,{status:400,code:"22P02",unchanged:true})).toThrow();
    expect(()=>validateObservation(spec,{status:400,code:"P0001",unchanged:false})).toThrow();
    expect(validateObservation(spec,{status:400,code:"P0001",unchanged:true})).toBe(true);
  });
  it("recusa campos secretos e exige precondições declaradas",()=>{
    const spec={kind:"scalar",status:200,value:false,precondition:"GA_SUSPENDED"};
    expect(()=>validateObservation(spec,{status:200,value:false})).toThrow();
    expect(()=>validateObservation(spec,{status:200,value:false,preconditionsVerified:true,Authorization:"secret"})).toThrow();
    expect(validateObservation(spec,{status:200,value:false,preconditionsVerified:true})).toBe(true);
  });
});
