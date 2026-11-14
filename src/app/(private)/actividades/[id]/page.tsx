import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminReadState } from "@/components/admin/read-state";
import styles from "@/components/activities/activities.module.css";
import { formatLuanda } from "@/lib/dates";
import { getActivityDraft } from "@/modules/activities/repository";
import { requireModule } from "@/modules/auth/session";

export const metadata = { title: "Rascunho de actividade" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireModule("activities.read");
  const { id } = await params;
  const result = await getActivityDraft(id);
  if (result.state === "invalid" || result.state === "not-found") notFound();

  return (
    <>
      <Link href="/actividades" className="text-link">Voltar aos rascunhos</Link>
      {result.state === "refused" ? (
        <>
          <div className="page-heading"><h1>Consulta de rascunho recusada</h1></div>
          <AdminReadState status="refused">Não foi possível autorizar esta consulta. Não são apresentados dados do rascunho.</AdminReadState>
        </>
      ) : result.state === "unavailable" || !result.data ? (
        <>
          <div className="page-heading"><h1>Consulta de rascunho indisponível</h1></div>
          <AdminReadState status="unavailable">Não foi possível confirmar os dados do rascunho. Verifique a disponibilidade do serviço com o responsável.</AdminReadState>
        </>
      ) : (
        <>
          <div className={`page-heading ${styles.heading}`}>
            <div><p className="eyebrow">Gestão de Actividades · {result.data.code}</p><h1>{result.data.title}</h1></div>
            <span className="badge">Rascunho incompleto</span>
          </div>
          <div className="notice"><div><strong>Este rascunho ainda não está atribuído</strong><p>Executores, prazos e gestor validador serão definidos num percurso posterior. Não é possível concluir ou submeter este registo nesta etapa.</p></div></div>
          <dl className={`panel ${styles.summary}`}>
            <div><dt>Código</dt><dd>{result.data.code}</dd></div>
            <div><dt>Estado</dt><dd>Rascunho</dd></div>
            <div><dt>Unidade responsável</dt><dd>{result.data.responsible_unit_name ?? "Designação da unidade indisponível"}</dd></div>
            <div><dt>Criador</dt><dd>{result.data.creator_name ?? "Nome do criador indisponível"}</dd></div>
            <div><dt>Criado em (Africa/Luanda)</dt><dd>{formatLuanda(result.data.created_at)}</dd></div>
            <div><dt>Actualizado em (Africa/Luanda)</dt><dd>{formatLuanda(result.data.updated_at)}</dd></div>
            <div><dt>Versão</dt><dd>{result.data.version}</dd></div>
          </dl>
          <section className="panel admin-section" aria-labelledby="description-heading">
            <h2 id="description-heading">Descrição</h2>
            <p className={styles.description}>{result.data.description || "Sem descrição registada."}</p>
          </section>
        </>
      )}
    </>
  );
}
