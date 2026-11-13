import { formatLuanda } from "@/lib/dates";
import { requireModule } from "@/modules/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MutationForm } from "@/components/admin/mutation-form";
import { Field, SelectField, AdminHeading } from "@/components/admin/fields";
import { AdminReadState } from "@/components/admin/read-state";
import {
  classifyReadResult,
  readStateMessage,
  validityLabel,
} from "@/modules/access/read-state";
export const metadata = { title: "Administração" };
export default async function Page() {
  const viewer = await requireModule("users.read");
  const db = await createSupabaseServerClient();
  const [usersResult, unitsResult, positionsResult, membershipsResult] = await Promise.all([
    db.from("profiles").select("id,full_name,email,status").order("full_name"),
    db.from("organizational_units").select("id,name").eq("active", true),
    db.from("positions").select("id,name").eq("active", true),
    db
      .from("user_positions")
      .select(
        "id,user_id,unit_id,valid_from,valid_until,positions(name),organizational_units(name)",
      )
      .order("valid_from", { ascending: false }),
  ]);
  const usersState = classifyReadResult(usersResult);
  const unitsState = classifyReadResult(unitsResult);
  const positionsState = classifyReadResult(positionsResult);
  const membershipsState = classifyReadResult(membershipsResult);
  const users = usersState.data;
  const units = unitsState.data;
  const positions = positionsState.data;
  const memberships = membershipsState.data;
  const now = new Date();
  const statuses: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    suspended: "Suspenso",
  };
  const people = (users ?? []).map((u) => ({
    value: u.id,
    label: u.full_name,
  }));
  const unitOptions = (units ?? []).map((u) => ({
    value: u.id,
    label: u.name,
  }));
  return (
    <>
      <AdminHeading title="Administração de utilizadores">
        Contas, estados e associações. Os dados e operações respeitam as
        políticas RLS.
      </AdminHeading>
      {usersState.status !== "ok" ? (
        <AdminReadState status={usersState.status}>
          {readStateMessage(usersState.status, "contas autorizadas", "Não existem contas visíveis neste âmbito.")}
        </AdminReadState>
      ) : (
        <div className="panel table-scroll">
          <table>
            <caption>Utilizadores no âmbito autorizado</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Correio electrónico</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    {statuses[u.status] ?? "Estado indisponível"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {unitsState.status !== "ok" && (
        <AdminReadState status={unitsState.status}>
          {readStateMessage(unitsState.status, "unidades para associação", "Sem unidades disponíveis para associação neste âmbito.")}
        </AdminReadState>
      )}
      {positionsState.status !== "ok" && (
        <AdminReadState status={positionsState.status}>
          {readStateMessage(positionsState.status, "cargos para associação", "Sem cargos disponíveis para associação neste âmbito.")}
        </AdminReadState>
      )}
      {viewer.permissions.includes("users.manage") && (
        <div className="admin-grid">
          <MutationForm title="Convidar utilizador" invitation>
            <p>
              Exige permissão global. A conta nasce inactiva; convite não
              atribui privilégios.
            </p>
            <Field name="full_name" label="Nome completo" />
            <Field name="email" label="Correio electrónico" type="email" />
          </MutationForm>
          <MutationForm
            title="Alterar estado da conta"
            operation="user_status"
            disabled={usersState.status !== "ok"}
            disabledReason={usersState.status !== "ok" ? "É necessário carregar utilizadores autorizados antes de alterar um estado." : undefined}
          >
            <SelectField name="user_id" label="Utilizador" options={people} />
            <SelectField
              name="status"
              label="Estado"
              options={[
                { value: "active", label: "Activo" },
                { value: "inactive", label: "Inactivo" },
                { value: "suspended", label: "Suspenso" },
              ]}
            />
          </MutationForm>
          <MutationForm
            title="Associar cargo e unidade"
            operation="assign_position"
            disabled={usersState.status !== "ok" || unitsState.status !== "ok" || positionsState.status !== "ok"}
            disabledReason={usersState.status !== "ok" || unitsState.status !== "ok" || positionsState.status !== "ok" ? "É necessário carregar utilizadores, unidades e cargos autorizados antes de associar." : undefined}
          >
            <p>
              A associação anterior é encerrada, preservando o histórico. Requer
              autorização também na unidade anterior.
            </p>
            <SelectField name="user_id" label="Utilizador" options={people} />
            <SelectField name="unit_id" label="Unidade" options={unitOptions} />
            <SelectField
              name="position_id"
              label="Cargo"
              options={(positions ?? []).map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </MutationForm>
        </div>
      )}
      <section className="panel admin-section">
        <h2>Histórico de associações autorizado</h2>
        <p>Datas e horas em Africa/Luanda. O estado da conta é distinto da vigência da associação.</p>
        {membershipsState.status !== "ok" ? (
          <AdminReadState status={membershipsState.status}>
            {readStateMessage(membershipsState.status, "histórico de associações", "Sem associações visíveis neste âmbito.")}
          </AdminReadState>
        ) : (
          <div className="table-scroll">
            <table>
              <caption>Cargos e unidades ao longo do tempo, no âmbito autorizado</caption>
              <thead>
                <tr>
                  <th scope="col">Utilizador</th>
                  <th scope="col">Estado da conta</th>
                  <th scope="col">Cargo</th>
                  <th scope="col">Unidade</th>
                  <th scope="col">Início</th>
                  <th scope="col">Fim</th>
                  <th scope="col">Vigência</th>
                </tr>
              </thead>
              <tbody>
                {memberships?.map((m) => {
                  const person = users?.find((u) => u.id === m.user_id);
                  const position = Array.isArray(m.positions) ? m.positions[0] : m.positions;
                  const unit = Array.isArray(m.organizational_units) ? m.organizational_units[0] : m.organizational_units;
                  return (
                    <tr key={m.id}>
                      <td>{person?.full_name ?? "Nome do utilizador indisponível"}</td>
                      <td>{person ? statuses[person.status] ?? "Estado indisponível" : "Estado indisponível"}</td>
                      <td>{position?.name ?? "Designação do cargo indisponível"}</td>
                      <td>{unit?.name ?? "Designação da unidade indisponível"}</td>
                      <td>{formatLuanda(m.valid_from)}</td>
                      <td>{formatLuanda(m.valid_until)}</td>
                      <td>{validityLabel(m.valid_from, m.valid_until, now)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
