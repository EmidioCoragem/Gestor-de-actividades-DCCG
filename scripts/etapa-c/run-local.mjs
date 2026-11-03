import { runLocalSuite } from "./runner.mjs";
try {
  const report=await runLocalSuite();
  console.log(JSON.stringify(report,null,2));
} catch {
  // Não despejar pedidos, cabeçalhos, payloads ou tokens em relatórios.
  console.error("Ensaio local Etapa C falhou. Investigar em ambiente local; não executar no Supabase.");
  process.exitCode=1;
}
