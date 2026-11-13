import { requireModule } from "@/modules/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MutationForm } from "@/components/admin/mutation-form";
import { Field, SelectField, AdminHeading } from "@/components/admin/fields";
import { AdminReadState } from "@/components/admin/read-state";
import { formatLuanda } from "@/lib/dates";
import {
  classifyReadResult,
  readStateMessage,
  readSucceeded,
  validityLabel,
} from "@/modules/access/read-state";
export const metadata = { title: "Estrutura Organizacional" };
export default async function Page() {
  const viewer = await requireModule("org.read");
  const db = await createSupabaseServerClient();
  const [unitsResult, positionsResult, peopleResult, linesResult, responsiblesResult] = await Promise.all([
    db
      .from("organizational_units")
      .select("id,code,name,kind,parent_id,active")
      .order("name"),
    db.from("positions").select("id,code,name"),
    db.from("profiles").select("id,full_name"),
    db
      .from("reporting_lines")
      .select("id,user_id,supervisor_id,unit_id,valid_from,valid_until")
      .order("valid_from", { ascending: false }),
    db
      .from("unit_responsibilities")
      .select("id,unit_id,user_id,valid_from,valid_until")
      .order("valid_from", { ascending: false }),
  ]);
  const unitsState = classifyReadResult(unitsResult);
  const positionsState = classifyReadResult(positionsResult);
  const peopleState = classifyReadResult(peopleResult);
  const linesState = classifyReadResult(linesResult);
  const responsiblesState = classifyReadResult(responsiblesResult);
  const units = unitsState.data;
  const positions = positionsState.data;
  const people = peopleState.data;
  const lines = linesState.data;
  const responsibles = responsiblesState.data;
  const now = new Date();
  const personName = (id: string) => people?.find((p) => p.id === id)?.full_name ?? "Nome da pessoa indisponível";
  const unitName = (id: string) => units?.find((u) => u.id === id)?.name ?? "Designação da unidade indisponível";
  const relationsDisabled = unitsState.status !== "ok" || peopleState.status !== "ok";
  const unitOptions = (units ?? []).map((u) => ({
    value: u.id,
    label: `${u.code} — ${u.name}`,
  }));
  const personOptions = (people ?? []).map((p) => ({
    value: p.id,
    label: p.full_name,
  }));
  return (
    <>
      <AdminHeading title="Estrutura Organizacional">
        Empresa, direcções, departamentos, secções e equipas configuráveis. A
        estrutura dos centros de custo é independente.
      </AdminHeading>
      {unitsState.status !== "ok" ? (
        <AdminReadState status={unitsState.status}>
          {readStateMessage(unitsState.status, "unidades autorizadas", "Sem unidades no âmbito autorizado.")}
        </AdminReadState>
      ) : <div className="panel table-scroll">
        <table>
          <caption>Unidades autorizadas</caption>
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Designação</th>
              <th scope="col">Tipo</th>
              <th scope="col">Unidade superior</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {units?.map((u) => (
              <tr key={u.id}>
                <td>{u.code}</td>
                <td>{u.name}</td>
                <td>
                  {
                    (
                      {
                        company: "Empresa",
                        direction: "Direcção",
                        department: "Departamento",
                        section: "Secção",
                        team: "Equipa",
                        other: "Outra",
                      } as Record<string, string>
                    )[u.kind]
                  }
                </td>
                <td>
                  {units?.find((p) => p.id === u.parent_id)?.name ??
                    (u.parent_id ? "Designação da unidade superior indisponível" : "Raiz")}
                </td>
                <td>{u.active ? "Activa" : "Inactiva"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
      {peopleState.status !== "ok" && (
        <AdminReadState status={peopleState.status}>
          {readStateMessage(peopleState.status, "pessoas autorizadas", "Sem pessoas disponíveis para definir relações neste âmbito.")}
        </AdminReadState>
      )}
      {viewer.permissions.includes("org.manage") && (
        <div className="admin-grid">
          <MutationForm
            title="Criar unidade"
            operation="unit_create"
            disabled={!readSucceeded(unitsState)}
            disabledReason={!readSucceeded(unitsState) ? "A lista de unidades precisa de estar disponível antes de escolher a unidade superior." : undefined}
          >
            <Field name="code" label="Código" />
            <Field name="name" label="Designação" />
            <SelectField
              name="kind"
              label="Tipo"
              options={[
                { value: "company", label: "Empresa" },
                { value: "direction", label: "Direcção" },
                { value: "department", label: "Departamento" },
                { value: "section", label: "Secção" },
                { value: "team", label: "Equipa" },
                { value: "other", label: "Outra" },
              ]}
            />
            <SelectField
              name="parent_id"
              label="Unidade superior (sem unidade apenas para a empresa)"
              options={unitOptions}
              optional
              optionalLabel="Sem unidade superior (apenas para a empresa)"
            />
          </MutationForm>
          <MutationForm
            title="Actualizar unidade"
            operation="unit_update"
            disabled={unitsState.status !== "ok"}
            disabledReason={unitsState.status !== "ok" ? "É necessário carregar unidades autorizadas antes de actualizar." : undefined}
          >
            <SelectField name="id" label="Unidade" options={unitOptions} />
            <Field name="name" label="Designação" />
            <SelectField
              name="parent_id"
              label="Unidade superior"
              options={unitOptions}
              optional
              optionalLabel="Sem unidade superior (apenas para a empresa)"
            />
            <SelectField
              name="active"
              label="Estado"
              options={[
                { value: "true", label: "Activa" },
                { value: "false", label: "Inactiva" },
              ]}
            />
          </MutationForm>
          <MutationForm title="Criar cargo" operation="position_create">
            <p>Exige âmbito global. O cargo não concede permissões.</p>
            <Field name="code" label="Código" />
            <Field name="name" label="Designação" />
          </MutationForm>
          <MutationForm
            title="Definir responsável de unidade"
            operation="set_responsible"
            disabled={relationsDisabled}
            disabledReason={relationsDisabled ? "É necessário carregar pessoas e unidades autorizadas antes de definir responsáveis." : undefined}
          >
            <SelectField name="unit_id" label="Unidade" options={unitOptions} />
            <SelectField
              name="user_id"
              label="Responsável pertencente à unidade"
              options={personOptions}
            />
          </MutationForm>
          <MutationForm
            title="Definir relação de chefia"
            operation="set_supervisor"
            disabled={relationsDisabled}
            disabledReason={relationsDisabled ? "É necessário carregar pessoas e unidades autorizadas antes de definir uma chefia." : undefined}
          >
            <SelectField
              name="unit_id"
              label="Unidade do trabalhador"
              options={unitOptions}
            />
            <SelectField
              name="user_id"
              label="Trabalhador"
              options={personOptions}
            />
            <SelectField
              name="supervisor_id"
              label="Chefia"
              options={personOptions}
            />
          </MutationForm>
        </div>
      )}
      <section className="panel admin-section">
        <h2>Cargos autorizados</h2>
        {positionsState.status !== "ok" ? (
          <AdminReadState status={positionsState.status}>
            {readStateMessage(positionsState.status, "cargos autorizados", "Sem cargos visíveis neste âmbito.")}
          </AdminReadState>
        ) : <ul>
          {positions?.map((p) => (
            <li key={p.id}>
              {p.code} — {p.name}
            </li>
          ))}
        </ul>}
      </section>
      <section className="panel admin-section">
        <h2>Relações de chefia autorizadas</h2>
        <p>Datas e horas em Africa/Luanda. Inclui relações em vigor, programadas e encerradas que sejam visíveis.</p>
        {linesState.status !== "ok" ? (
          <AdminReadState status={linesState.status}>
            {readStateMessage(linesState.status, "relações de chefia", "Sem relações de chefia visíveis neste âmbito.")}
          </AdminReadState>
        ) : (
          <div className="table-scroll">
            <table>
              <caption>Trabalhadores, chefias e vigência no âmbito autorizado</caption>
              <thead>
                <tr>
                  <th scope="col">Trabalhador</th>
                  <th scope="col">Chefia</th>
                  <th scope="col">Unidade</th>
                  <th scope="col">Início</th>
                  <th scope="col">Fim</th>
                  <th scope="col">Vigência</th>
                </tr>
              </thead>
              <tbody>
                {lines?.map((line) => (
                  <tr key={line.id}>
                    <td>{personName(line.user_id)}</td>
                    <td>{personName(line.supervisor_id)}</td>
                    <td>{unitName(line.unit_id)}</td>
                    <td>{formatLuanda(line.valid_from)}</td>
                    <td>{formatLuanda(line.valid_until)}</td>
                    <td>{validityLabel(line.valid_from, line.valid_until, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel admin-section">
        <h2>Responsáveis de unidade autorizados</h2>
        <p>Datas e horas em Africa/Luanda. O organograma interactivo permanece uma evolução futura.</p>
        {responsiblesState.status !== "ok" ? (
          <AdminReadState status={responsiblesState.status}>
            {readStateMessage(responsiblesState.status, "responsabilidades de unidade", "Sem responsabilidades de unidade visíveis neste âmbito.")}
          </AdminReadState>
        ) : (
          <div className="table-scroll">
            <table>
              <caption>Responsáveis, unidades e vigência no âmbito autorizado</caption>
              <thead>
                <tr>
                  <th scope="col">Unidade</th>
                  <th scope="col">Responsável</th>
                  <th scope="col">Início</th>
                  <th scope="col">Fim</th>
                  <th scope="col">Vigência</th>
                </tr>
              </thead>
              <tbody>
                {responsibles?.map((responsible) => (
                  <tr key={responsible.id}>
                    <td>{unitName(responsible.unit_id)}</td>
                    <td>{personName(responsible.user_id)}</td>
                    <td>{formatLuanda(responsible.valid_from)}</td>
                    <td>{formatLuanda(responsible.valid_until)}</td>
                    <td>{validityLabel(responsible.valid_from, responsible.valid_until, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
