import { randomUUID } from "node:crypto";
import Link from "next/link";
import { AdminReadState } from "@/components/admin/read-state";
import { ActivityDraftForm } from "@/components/activities/draft-form";
import styles from "@/components/activities/activities.module.css";
import { formatLuanda } from "@/lib/dates";
import { getActivityDrafts, getActivityDraftUnits } from "@/modules/activities/repository";
import { requireModule } from "@/modules/auth/session";

export const metadata = { title: "Gestão de Actividades" };

export default async function Page({ searchParams }: {
  searchParams: Promise<{ pagina?: string | string[]; novo?: string | string[] }>;
}) {
  const viewer = await requireModule("activities.read");
  const search = await searchParams;
  const page = typeof search.pagina === "string" && /^[1-9]\d{0,5}$/.test(search.pagina)
    ? Number(search.pagina) : 1;
  const canCreate = viewer.permissions.includes("activities.create");
  const [drafts, units] = await Promise.all([
    getActivityDrafts({ page, pageSize: 10 }),
    canCreate ? getActivityDraftUnits() : Promise.resolve(null),
  ]);
  // Only the explicit "create another" navigation changes this key. A normal
  // action revalidation must retain the request held by the client component.
  const newIntention = typeof search.novo === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search.novo)
    ? search.novo : "initial";

  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">Operações · Gestão de Actividades</p><h1>Gestão de Actividades</h1><p>Crie e consulte rascunhos no âmbito autorizado.</p></div>
        <span className="badge">Rascunhos · Fase 2</span>
      </div>
      <div className="notice"><div><strong>Um primeiro registo, ainda incompleto</strong><p>Este percurso guarda apenas rascunhos. Atribuição de executores, prazos, submissão e validação ainda não estão disponíveis.</p></div></div>
      <section aria-labelledby="drafts-heading">
        <div className="section-heading"><h2 id="drafts-heading">Rascunhos autorizados</h2></div>
        {drafts.state === "refused" ? (
          <AdminReadState status="refused">A consulta dos rascunhos foi recusada. Verifique o seu âmbito com o responsável de acessos.</AdminReadState>
        ) : drafts.state === "unavailable" ? (
          <AdminReadState status="unavailable">Não foi possível carregar os rascunhos. A configuração ou a instalação necessária pode ainda estar pendente; não se conclui que a lista esteja vazia.</AdminReadState>
        ) : drafts.state === "empty" ? (
          <AdminReadState status="empty">Não existem rascunhos visíveis nesta página do âmbito autorizado.</AdminReadState>
        ) : (
          <div className="panel table-scroll" role="region" aria-label="Tabela de rascunhos" tabIndex={0}>
            <table className={styles.table}>
              <caption>Rascunhos no âmbito autorizado</caption>
              <thead><tr><th scope="col">Código</th><th scope="col">Título</th><th scope="col">Unidade responsável</th><th scope="col">Estado</th><th scope="col">Criado em (Africa/Luanda)</th></tr></thead>
              <tbody>{drafts.data.map((draft) => (
                <tr key={draft.id}><td>{draft.code}</td><td><Link href={`/actividades/${draft.id}`}>{draft.title}</Link></td><td>{draft.responsible_unit_name ?? "Designação da unidade indisponível"}</td><td>Rascunho incompleto</td><td>{formatLuanda(draft.created_at)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {(drafts.state === "ok" || drafts.state === "empty") && (
          <nav className={styles.pagination} aria-label="Paginação dos rascunhos">
            {drafts.pagination.page > 1 && <Link className="text-link" href={`/actividades?pagina=${drafts.pagination.page - 1}`} rel="prev">Página anterior</Link>}
            <span>Página {drafts.pagination.page}{drafts.pagination.totalPages !== null ? ` de ${Math.max(1, drafts.pagination.totalPages)}` : ""}</span>
            {drafts.pagination.totalPages !== null && drafts.pagination.page < drafts.pagination.totalPages && <Link className="text-link" href={`/actividades?pagina=${drafts.pagination.page + 1}`} rel="next">Página seguinte</Link>}
          </nav>
        )}
      </section>
      {canCreate && units ? (
        units.state === "ok" && units.data.length > 0 ? (
          <ActivityDraftForm
            key={newIntention}
            requestId={randomUUID()}
            units={units.data}
          />
        ) : (
          <AdminReadState status={units.state === "refused" ? "refused" : units.state === "unavailable" ? "unavailable" : "empty"}>
            {units.state === "refused"
            ? "A consulta de unidades autorizadas para criação foi recusada. Não é possível guardar este rascunho."
            : units.state === "unavailable"
              ? "As unidades autorizadas estão indisponíveis. Aguarde a confirmação da configuração antes de guardar."
              : "Não existem unidades autorizadas disponíveis para criar rascunhos."}
          </AdminReadState>
        )
      ) : <p className="empty-note">A criação de rascunhos exige autorização própria. A navegação não concede essa permissão.</p>}
    </>
  );
}
